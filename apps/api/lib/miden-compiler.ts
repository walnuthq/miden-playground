import { cp, writeFile, readFile, rm, readdir, mkdir } from "node:fs/promises";
import { execFile, fileExists } from "@/lib/utils";
import { defaultDependencies, type Export, type Dependency } from "@/lib/types";

const projectRoot = process.env.NODE_ENV !== "production" ? "." : "../../../..";

const packagesPath = process.env.PACKAGES_PATH ?? "/tmp";

export const cargoMidenVersion = async () => {
  const { stdout } = await execFile("cargo", ["miden", "--version"]);
  const [, semver] = stdout.split(" ");
  return semver!.replaceAll("\n", "");
};

export const packageExists = async (packageDir: string) =>
  fileExists(`${packagesPath}/${packageDir}`);

export const setupDefaultPackagesDir = async () => {
  const defaultPackagesExists = await fileExists(
    `${packagesPath}/default-packages/basic-wallet`
  );
  if (defaultPackagesExists) {
    return;
  }
  const defaultPackages = await readdir("default-packages");
  for (const defaultPackage of defaultPackages) {
    console.info(
      `cp -r default-packages/${defaultPackage} ${packagesPath}/${defaultPackage}`
    );
    await cp(
      `default-packages/${defaultPackage}`,
      `${packagesPath}/${defaultPackage}`,
      {
        recursive: true,
      }
    );
    // await compilePackage(defaultPackage);
  }
};

export const newPackage = async ({
  packageDir,
  name,
  type,
  example,
}: {
  packageDir: string;
  name: string;
  type: string;
  example: string;
}) => {
  const dependencies = defaultDependencies();
  if (example === "none") {
    // await setupDefaultPackagesDir();
    const rust = await readFile(`${projectRoot}/templates/${type}.rs`, "utf-8");
    await generatePackageDir({
      packageDir,
      name,
      type,
      rust,
      dependencies,
    });
  } else {
    console.info(`cp -r examples/${example} ${packagesPath}/${packageDir}`);
    await cp(
      `${projectRoot}/examples/${example}`,
      `${packagesPath}/${packageDir}`,
      {
        recursive: true,
      }
    );
  }
  compilePackage(packageDir);
  const rust = await readRust(packageDir);
  return { rust, dependencies };
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
  dependencies: Dependency[];
}) => {
  // await Promise.all(
  //   dependencies.map(async (dependency) => {
  //     const dependencyExists = await packageExists(dependency.id);
  //     if (!dependencyExists) {
  //       await generatePackageDir({
  //         packageDir: dependency.id,
  //         name: dependency.name,
  //       });
  //     }
  //   })
  // );
  await mkdir(`${packagesPath}/${packageDir}`);
  await Promise.all([
    mkdir(`${packagesPath}/${packageDir}/src`),
    cp(
      `${projectRoot}/default-packages/counter-contract/cargo-generate.toml`,
      `${packagesPath}/${packageDir}/cargo-generate.toml`
    ),
    generateCargoToml({
      packageDir,
      name,
      type,
      dependencies,
    }),
    cp(
      `${projectRoot}/default-packages/counter-contract/rust-toolchain.toml`,
      `${packagesPath}/${packageDir}/rust-toolchain.toml`
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
  cargoToml += `edition = "2021"\n\n`;
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
  const actualDependencies = dependencies.filter(
    ({ name }) => !["std", "base"].includes(name)
  );
  if (actualDependencies.length > 0) {
    const midenDependencies = actualDependencies.map(
      ({ id, name }) => `"miden:${name}" = { path = "${packagesPath}/${id}" }`
    );
    cargoToml += `[package.metadata.miden.dependencies]\n`;
    cargoToml += `${midenDependencies.join("\n")}\n\n`;
    const targetDependencies = actualDependencies.map(
      ({ id, name }) =>
        `"miden:${name}" = { path = "${packagesPath}/${id}/target/generated-wit" }`
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
      }
    );
    return { stdout, stderr: "" };
  } catch (error) {
    const { stderr } = error as { stderr: string };
    return { stdout: "", stderr };
  }
};

const readPackageMetadata = async (maspPath: string) => {
  const { stdout } = await execFile(
    "./miden_package_introspection",
    [maspPath],
    {
      cwd: `${projectRoot}/miden-package-introspection/target/release`,
    }
  );
  const { exports, dependencies } = JSON.parse(stdout) as {
    exports: Export[];
    dependencies: Dependency[];
  };
  return {
    exports: exports.map((procedureExport) => {
      const [, name = ""] = procedureExport.name.split("::");
      return { ...procedureExport, name };
    }),
    dependencies: dependencies.map((dependency) => ({
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
  const packageBuffer = await readFile(maspPath);
  const { exports, dependencies } = await readPackageMetadata(maspPath);
  return { packageBuffer, exports, dependencies };
};

export const deletePackage = (packageDir: string) => {
  console.info(`rm -rf ${packagesPath}/${packageDir}`);
  return rm(`${packagesPath}/${packageDir}`, { recursive: true, force: true });
};
