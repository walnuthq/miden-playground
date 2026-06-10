import { access, constants, rm, readdir, readFile } from "node:fs/promises";
import { execFile as execFileCb, exec as execCb } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { validate, version } from "uuid";
import type { PathLike, RmOptions } from "node:fs";
import { parse } from "smol-toml";
import type {
  CargoToml,
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
    [`${name}/Cargo.toml`]: generateCargoToml({
      name,
      type,
      dependencies,
    }),
    [`${name}/miden-toolchain.toml`]:
      projectTemplateFiles["miden-toolchain.toml"],
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
  updatedFiles[`${name}/Cargo.toml`] = generateCargoToml({
    name,
    type,
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
    body: JSON.stringify({
      files,
      entrypoint: name,
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    const { error } = result as { error: string };
    throw new Error(error);
  }
  const { stdout, stderr } = result as { stdout: string; stderr: string };
  if (stdout === "" && stderr !== "") {
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

export const generateCargoToml = ({
  name,
  type,
  dependencies,
}: {
  name: string;
  type: string;
  dependencies: Dependency[];
}) => {
  let cargoToml = `cargo-features = ["trim-paths"]\n\n`;
  cargoToml += `[package]\n`;
  cargoToml += `name = "${name}"\n`;
  cargoToml += `version = "0.1.0"\n`;
  cargoToml += `edition = "2024"\n\n`;
  cargoToml += `[lib]\n`;
  cargoToml += `crate-type = ["cdylib"]\n\n`;
  cargoToml += `[dependencies]\n`;
  cargoToml += `miden = { version = "0.12" }\n\n`;
  cargoToml += `[package.metadata.component]\n`;
  cargoToml += `package = "miden:${name}"\n\n`;
  cargoToml += `[package.metadata.miden]\n`;
  cargoToml += `project-kind = "${type}"\n`;
  if (type === "account") {
    cargoToml += `supported-types = ["RegularAccountUpdatableCode"]\n`;
  }
  cargoToml += "\n";
  if (dependencies.length > 0) {
    const midenDependencies = dependencies.map(
      ({ name }) => `"miden:${name}" = { path = "../${name}" }`,
    );
    cargoToml += `[package.metadata.miden.dependencies]\n`;
    cargoToml += `${midenDependencies.join("\n")}\n\n`;
    const targetDependencies = dependencies.map(
      ({ name }) =>
        `"miden:${name}" = { path = "../${name}/target/generated-wit" }`,
    );
    cargoToml += `[package.metadata.component.target.dependencies]\n`;
    cargoToml += `${targetDependencies.join("\n")}\n\n`;
  }
  cargoToml += `[profile.release]\n`;
  cargoToml += `trim-paths = ["diagnostics", "object"]\n\n`;
  cargoToml += `[profile.dev]\n`;
  cargoToml += `trim-paths = ["diagnostics", "object"]\n\n`;
  return cargoToml;
};

export const parseCargoToml = (cargoToml: string) =>
  parse(cargoToml) as CargoToml;
