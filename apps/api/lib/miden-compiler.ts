import { cp, writeFile, readFile, mkdir } from "node:fs/promises";
import { parse } from "smol-toml";
import { execFile, fileExists, safeRm } from "@/lib/utils";
import { type Export, type Dependency, type CargoToml } from "@/lib/types";
import { insertPackage, getDependencies } from "@/db/packages";
import { type PackageType } from "@/lib/types";
import { PACKAGES_PATH, PROJECT_ROOT } from "@/lib/constants";
import { midenPackageMetadata } from "@/lib/miden-package-metadata";

export const cargoMidenVersion = async () => {
  const { stdout } = await execFile("miden", ["cargo-miden", "--version"], {
    cwd: `${PROJECT_ROOT}/templates`,
  });
  const [, semver = ""] = stdout.split(" ");
  return semver.replaceAll("\n", "");
};

export const packageExists = async (packageDir: string) =>
  fileExists(`${PACKAGES_PATH}/${packageDir}`);

export const newPackage = async ({
  name,
  type,
  example,
  rust,
  dependencies = [],
}: {
  name: string;
  type: PackageType;
  example?: string;
  rust?: string;
  dependencies?: Dependency[];
}): Promise<{ id: string; rust: string; dependencies: Dependency[] }> => {
  const initialRust = rust
    ? rust
    : await readFile(
        `${PROJECT_ROOT}/templates/${example ?? type}.rs`,
        "utf-8",
      );
  const id = await insertPackage({
    name,
    type,
    readOnly: !!rust,
    rust: initialRust,
    dependencies: dependencies.map(({ id }) => id),
  });
  await generatePackageDir({
    packageDir: id,
    name,
    type,
    rust: initialRust,
    dependencies: dependencies.map(({ id }) => id),
  });
  // compilePackage(id);
  return { id, rust: initialRust, dependencies };
};

export const readRust = async (packageDir: string) => {
  console.info(`cat ${PACKAGES_PATH}/${packageDir}/src/lib.rs`);
  return readFile(`${PACKAGES_PATH}/${packageDir}/src/lib.rs`, "utf-8");
};

export const generatePackageDir = async ({
  packageDir,
  name,
  type,
  rust,
  dependencies,
}: {
  packageDir: string;
  name: string;
  type: string;
  rust: string;
  dependencies: string[];
}) => {
  const dependenciesPackages =
    dependencies.length > 0 ? await getDependencies(dependencies) : [];
  await Promise.all(
    dependenciesPackages.map(async (dependency) => {
      const exists = await packageExists(dependency.id);
      if (exists) {
        return;
      }
      return generatePackageDir({
        packageDir: dependency.id,
        name: dependency.name,
        type: dependency.type,
        rust: dependency.rust,
        dependencies: dependency.dependencies,
      });
    }),
  );
  await mkdir(`${PACKAGES_PATH}/${packageDir}`);
  await Promise.all([
    mkdir(`${PACKAGES_PATH}/${packageDir}/src`),
    generateCargoToml({
      packageDir,
      name,
      type,
      dependencies: dependenciesPackages,
    }),
    cp(
      `${PROJECT_ROOT}/templates/miden-toolchain.toml`,
      `${PACKAGES_PATH}/${packageDir}/miden-toolchain.toml`,
    ),
    cp(
      `${PROJECT_ROOT}/templates/rust-toolchain.toml`,
      `${PACKAGES_PATH}/${packageDir}/rust-toolchain.toml`,
    ),
  ]);
  await updateRust({ packageDir, rust });
};

export const generateCargoToml = ({
  packageDir,
  name,
  type,
  dependencies,
}: {
  packageDir: string;
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
  cargoToml += `miden = { version = "0.10" }\n\n`;
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
      ({ id, name }) => `"miden:${name}" = { path = "${PACKAGES_PATH}/${id}" }`,
    );
    cargoToml += `[package.metadata.miden.dependencies]\n`;
    cargoToml += `${midenDependencies.join("\n")}\n\n`;
    const targetDependencies = dependencies.map(
      ({ id, name }) =>
        `"miden:${name}" = { path = "${PACKAGES_PATH}/${id}/target/generated-wit" }`,
    );
    cargoToml += `[package.metadata.component.target.dependencies]\n`;
    cargoToml += `${targetDependencies.join("\n")}\n\n`;
  }
  cargoToml += `[profile.release]\n`;
  cargoToml += `trim-paths = ["diagnostics", "object"]\n\n`;
  cargoToml += `[profile.dev]\n`;
  cargoToml += `trim-paths = ["diagnostics", "object"]\n\n`;
  return writeFile(`${PACKAGES_PATH}/${packageDir}/Cargo.toml`, cargoToml);
};

export const updateRust = ({
  packageDir,
  rust,
}: {
  packageDir: string;
  rust: string;
}) => {
  console.info(`cp rust ${PACKAGES_PATH}/${packageDir}/src/lib.rs`);
  return writeFile(`${PACKAGES_PATH}/${packageDir}/src/lib.rs`, rust);
};

export const compilePackage = async (packageDir: string) => {
  try {
    console.info("miden build --release");
    const { stdout } = await execFile("miden", ["build", "--release"], {
      cwd: `${PACKAGES_PATH}/${packageDir}`,
    });
    return { stdout, stderr: "" };
  } catch (error) {
    const { stderr } = error as { stderr: string };
    return { stdout: "", stderr };
  }
};

const readPackageMetadata = async (maspPath: string) => {
  const packageMetadata = await midenPackageMetadata(maspPath);
  const {
    digest,
    manifest: { exports, dependencies },
  } = JSON.parse(packageMetadata) as {
    digest: string;
    manifest: { exports: Export[]; dependencies: Dependency[] };
  };
  return {
    digest,
    exports,
    dependencies: dependencies
      .filter(({ name }) => !["base", "std"].includes(name))
      .map((dependency) => ({
        ...dependency,
        name: dependency.name.replaceAll("_", "-"),
      })),
  };
};

export const packagePath = ({
  packageDir,
  name,
}: {
  packageDir: string;
  name: string;
}) => {
  const packageName = name.replaceAll("-", "_");
  return `${PACKAGES_PATH}/${packageDir}/target/miden/release/${packageName}.masp`;
};

export const readPackage = async ({
  packageDir,
  name,
}: {
  packageDir: string;
  name: string;
}) => {
  const maspPath = packagePath({ packageDir, name });
  const maspBuffer = await readFile(maspPath);
  const { digest, exports, dependencies } = await readPackageMetadata(maspPath);
  return {
    masp: maspBuffer.toString("base64"),
    digest,
    exports,
    dependencies,
  };
};

export const deletePackageDir = async (packageDir: string) => {
  console.info(`rm -rf ${PACKAGES_PATH}/${packageDir}`);
  return safeRm(`${PACKAGES_PATH}/${packageDir}`, {
    recursive: true,
    force: true,
  });
};

export const parseCargoToml = (cargoToml: string) =>
  parse(cargoToml) as CargoToml;
