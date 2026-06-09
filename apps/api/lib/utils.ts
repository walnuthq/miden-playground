import { access, constants, rm, readdir, readFile } from "node:fs/promises";
import { execFile as execFileCb, exec as execCb } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { validate, version } from "uuid";
import type { PathLike, RmOptions } from "node:fs";
import type { Dependency } from "@/lib/types";

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
