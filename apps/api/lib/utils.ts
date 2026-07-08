import { access, constants, rm, readdir, readFile } from "node:fs/promises";
import { execFile as execFileCb, exec as execCb } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import type { PathLike, RmOptions } from "node:fs";
import { kebabCase } from "lodash";
import { validate, version } from "uuid";
import { parse } from "smol-toml";
import type {
  MidenProjectToml,
  Dependency,
  Manifest,
  PackageType,
  CompiledPackage,
} from "@/lib/types";
import { projectTemplateFiles } from "@/lib/templates";
import {
  getDependencies,
  getPackage,
  insertPackage,
  updatePackage,
} from "@/db/packages";
import { API_COMPILE_URL } from "@/lib/constants";

export const execFile = promisify(execFileCb);

export const exec = promisify(execCb);

export const fileExists = async (fileName: string) => {
  try {
    await access(fileName, constants.F_OK);
    return true; // eslint-disable-next-line
  } catch (_) {
    return false;
  }
};

export const safeRm = async (path: PathLike, options?: RmOptions) => {
  try {
    await rm(path, options);
  } catch (error) {
    console.error(error);
  }
};

export const isValidUUIDv4 = (uuid: string) =>
  validate(uuid) && version(uuid) === 4;

export const readProjectFiles = async (rootDir: string) => {
  const entries = await readdir(rootDir, {
    recursive: true,
    withFileTypes: true,
  });
  const files = await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isFile()) return;
      const full = path.join(entry.parentPath, entry.name);
      const rel = path.relative(rootDir, full);
      if (rel.includes("target/") || rel === ".DS_Store") return;
      return { path: rel, content: await readFile(full, "utf8") };
    }),
  );
  return files
    .filter((file) => file !== undefined)
    .reduce<Record<string, string>>((previousValue, currentValue) => {
      previousValue[currentValue.path] = currentValue.content;
      return previousValue;
    }, {});
};

export const createPackage = ({
  name,
  type,
  rust,
  dependencies = [],
}: {
  name: string;
  type: PackageType;
  rust: string;
  dependencies?: Dependency[];
}) => {
  const files = {
    [`${name}/.cargo/config.toml`]: projectTemplateFiles[".cargo/config.toml"],
    [`${name}/src/lib.rs`]: rust,
    [`${name}/Cargo.toml`]: generateCargoToml({ name }),
    [`${name}/miden-project.toml`]: generateMidenProjectToml({
      name,
      type,
      rust,
      dependencies,
    }),
    [`${name}/rust-toolchain.toml`]:
      projectTemplateFiles["rust-toolchain.toml"],
  };
  return insertPackage({
    name,
    type,
    dependencies: dependencies.map(({ id }) => id),
    files,
  });
};

const hasWarningThenFinished = (stderr: string, name: string) => {
  // Escape the crate name so regex metacharacters in it are treated literally
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const warningRe = new RegExp("^\\s*warning:\\s*`" + escaped + "`");
  const finishedRe = /^\s*Finished\s+`release`\s+profile/;
  const lines = stderr.split(/\r?\n/);
  for (let i = 0; i < lines.length - 1; i++) {
    if (warningRe.test(lines[i] ?? "") && finishedRe.test(lines[i + 1] ?? "")) {
      return true;
    }
  }
  return false;
};

export const compilePackage = async ({
  id,
  rust,
  dependencies,
}: {
  id: string;
  rust: string;
  dependencies: string[];
}): Promise<CompiledPackage> => {
  const [dbPackage, dependenciesPackages] = await Promise.all([
    getPackage(id),
    getDependencies(dependencies),
  ]);
  if (!dbPackage) {
    throw new Error("Error: Package not found");
  }
  const { name, type } = dbPackage;
  const updatedFiles = dbPackage.files;
  updatedFiles[`${name}/src/lib.rs`] = rust;
  updatedFiles[`${name}/miden-project.toml`] = generateMidenProjectToml({
    name,
    type,
    rust,
    dependencies: dependenciesPackages,
  });
  const files = dependenciesPackages.reduce<Record<string, string>>(
    (previousValue, currentValue) => {
      for (const [path, content] of Object.entries(currentValue.files)) {
        previousValue[path] = content;
      }
      return previousValue;
    },
    updatedFiles,
  );
  const response = await fetch(`${API_COMPILE_URL}/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files, entrypoint: name }),
  });
  const result = await response.json();
  if (!response.ok) {
    const { error } = result as { error: string };
    throw new Error(error);
  }
  const { stdout, stderr } = result as { stdout: string; stderr: string };
  if (stdout === "" && stderr !== "" && !hasWarningThenFinished(stderr, name)) {
    console.error(stderr);
    await updatePackage({
      id,
      status: "error",
      rust,
      files: updatedFiles,
      dependencies,
      exports: [],
    });
    return {
      id,
      name,
      type,
      status: "error",
      rust,
      error: stderr,
      masm: "",
      digest: "",
      masp: "",
      exports: [],
      dependencies: dependenciesPackages.map(({ id, name, type, digest }) => ({
        id,
        name,
        type,
        digest,
      })),
    };
  }
  const { masp, digest, manifest } = result as {
    masp: string;
    digest: string;
    manifest: Manifest;
  };
  const exports = manifest.exports.filter(
    ({ Procedure: { signature } }) => signature?.abi === 3,
  );
  await updatePackage({
    id,
    status: "compiled",
    rust,
    files: updatedFiles,
    masp,
    digest,
    exports,
    dependencies,
  });
  return {
    id,
    name,
    type,
    status: "compiled",
    rust,
    error: "",
    masm: "",
    digest,
    masp,
    exports,
    dependencies: dependenciesPackages.map((dependencyPackage) => {
      const dependency = manifest.dependencies.find(
        ({ name }) => name.replaceAll("_", "-") === dependencyPackage.name,
      );
      return {
        id: dependencyPackage.id,
        name: dependencyPackage.name,
        type: dependencyPackage.type,
        digest: dependency?.digest ?? "",
      };
    }),
  };
};

const extractTraitName = (rust: string) => {
  const pattern =
    /#\[\s*component\b[^\]]*\]\s*(?:#\[[^\]]*\]\s*)*(?:pub(?:\([^)]*\))?\s+)?(?:unsafe\s+)?trait\s+([A-Za-z_]\w*)/;
  const match = rust.match(pattern);
  return match ? match[1] : null;
};

export const generateCargoToml = ({
  name,
  version = "0.1.0",
}: {
  name: string;
  version?: string;
}) => {
  let cargoToml = `[package]\n`;
  cargoToml += `name = "${name}"\n`;
  cargoToml += `version = "${version}"\n`;
  cargoToml += `edition = "2021"\n\n`;
  cargoToml += `[lib]\n`;
  cargoToml += `crate-type = ["cdylib"]\n\n`;
  cargoToml += `[dependencies]\n`;
  cargoToml += `miden = "0.13"\n`;
  return cargoToml;
};

export const generateMidenProjectToml = ({
  name,
  version = "0.1.0",
  type,
  rust,
  dependencies,
}: {
  name: string;
  version?: string;
  type: string;
  rust: string;
  dependencies: Dependency[];
}) => {
  const traitName = extractTraitName(rust) ?? name;
  let midenProjectToml = `[package]\n`;
  midenProjectToml += `name = "${name}"\n`;
  midenProjectToml += `version = "${version}"\n\n`;
  midenProjectToml += `[lib]\n`;
  midenProjectToml += `kind = "${type}"\n`;
  midenProjectToml += `namespace = "miden:${name}/${kebabCase(traitName)}@${version}"\n\n`;
  midenProjectToml += `[dependencies]\n`;
  midenProjectToml += `miden-core = "*"\n`;
  midenProjectToml += `miden-protocol = "*"\n`;
  if (dependencies.length > 0) {
    const midenDependencies = dependencies.map(
      ({ name }) => `${name} = { path = "../${name}" }`,
    );
    midenProjectToml += `${midenDependencies.join("\n")}\n\n`;
    const targetDependencies = dependencies.map(
      ({ name }) => `${name} = { wit = "../${name}/target/generated-wit/" }`,
    );
    midenProjectToml += `[package.metadata.miden.dependencies]\n`;
    midenProjectToml += `${targetDependencies.join("\n")}\n`;
  }
  midenProjectToml += "\n";
  if (type === "account") {
    midenProjectToml += `[package.metadata.miden]\n`;
    midenProjectToml += `supported-types = ["RegularAccountUpdatableCode"]\n\n`;
  }
  return midenProjectToml;
};

export const parseMidenProjectToml = (midenProjectToml: string) =>
  parse(midenProjectToml) as MidenProjectToml;
