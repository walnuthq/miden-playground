import { cp, writeFile, readFile, rm, mkdir } from "node:fs/promises";
import { execFile, fileExists } from "@/lib/utils";
import { parse } from "smol-toml";
import { type Export, type Dependency, type CargoToml } from "@/lib/types";
import { insertPackage, getDependencies } from "@/db/packages";
import { type PackageType } from "@/lib/types";
import { packagesPath, projectRoot } from "@/lib/constants";
import { midenPackageMetadata } from "@/lib/miden-package-metadata";

export const cargoMidenVersion = async () => {
  const { stdout } = await execFile("cargo", ["miden", "--version"]);
  const [, semver] = stdout.split(" ");
  return semver!.replaceAll("\n", "");
};

export const packageExists = async (packageDir: string) =>
  fileExists(`${packagesPath}/${packageDir}`);

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
    : await readFile(`${projectRoot}/templates/${example ?? type}.rs`, "utf-8");
  const id = await insertPackage({
    name,
    type,
    status: rust ? "compiled" : "draft",
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
  console.info(`cat ${packagesPath}/${packageDir}/src/lib.rs`);
  return readFile(`${packagesPath}/${packageDir}/src/lib.rs`, "utf-8");
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
  await mkdir(`${packagesPath}/${packageDir}`);
  await Promise.all([
    mkdir(`${packagesPath}/${packageDir}/src`),
    cp(
      `${projectRoot}/templates/cargo-generate.toml`,
      `${packagesPath}/${packageDir}/cargo-generate.toml`,
    ),
    generateCargoToml({
      packageDir,
      name,
      type,
      dependencies: dependenciesPackages,
    }),
    cp(
      `${projectRoot}/templates/rust-toolchain.toml`,
      `${packagesPath}/${packageDir}/rust-toolchain.toml`,
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
  cargoToml += `miden = { git = "https://github.com/0xMiden/compiler" }\n\n`;
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
      ({ id, name }) => `"miden:${name}" = { path = "${packagesPath}/${id}" }`,
    );
    cargoToml += `[package.metadata.miden.dependencies]\n`;
    cargoToml += `${midenDependencies.join("\n")}\n\n`;
    const targetDependencies = dependencies.map(
      ({ id, name }) =>
        `"miden:${name}" = { path = "${packagesPath}/${id}/target/generated-wit" }`,
    );
    cargoToml += `[package.metadata.component.target.dependencies]\n`;
    cargoToml += `${targetDependencies.join("\n")}\n\n`;
  }
  cargoToml += `[profile.release]\n`;
  cargoToml += `trim-paths = ["diagnostics", "object"]\n\n`;
  cargoToml += `[profile.dev]\n`;
  cargoToml += `trim-paths = ["diagnostics", "object"]\n\n`;
  return writeFile(`${packagesPath}/${packageDir}/Cargo.toml`, cargoToml);
};

export const updateRust = ({
  packageDir,
  rust,
}: {
  packageDir: string;
  rust: string;
}) => {
  console.info(`cp rust ${packagesPath}/${packageDir}/src/lib.rs`);
  writeFile(`${packagesPath}/${packageDir}/src/lib.rs`, rust);
};

export const compilePackage = async (packageDir: string) => {
  try {
    console.info("cargo miden build --release");
    const { stdout } = await execFile(
      "cargo",
      ["miden", "build", "--release"],
      {
        cwd: `${packagesPath}/${packageDir}`,
      },
    );
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
    exports: exports.map((procedureExport) => {
      const [, name = ""] = procedureExport.name.split("::");
      return { ...procedureExport, name };
    }),
    dependencies: dependencies
      .filter(({ name }) => !["base", "std"].includes(name))
      .map((dependency) => ({
        ...dependency,
        name: dependency.name.replaceAll("_", "-"),
      })),
  };
};

export const readPackage = async ({
  packageDir,
  name,
}: {
  packageDir: string;
  name: string;
}) => {
  const packageName = name.replaceAll("-", "_");
  const maspPath = `${packagesPath}/${packageDir}/target/miden/release/${packageName}.masp`;
  const maspBuffer = await readFile(maspPath);
  const { digest, exports, dependencies } = await readPackageMetadata(maspPath);
  return {
    masp: maspBuffer.toString("base64"),
    digest,
    exports,
    dependencies,
  };
};

export const deletePackageDir = (packageDir: string) => {
  console.info(`rm -rf ${packagesPath}/${packageDir}`);
  return rm(`${packagesPath}/${packageDir}`, { recursive: true, force: true });
};

export const parseCargoToml = (cargoToml: string) =>
  parse(cargoToml) as CargoToml;
