import { cp, writeFile, readFile } from "node:fs/promises";
import { parse } from "smol-toml";
import {
  execFile,
  fileExists,
  generateMidenProjectToml,
  safeRm,
  hasWarningThenFinished,
} from "@/lib/utils";
import type { Export, Dependency, MidenProjectToml } from "@/lib/types";
import { insertPackage, getDependencies } from "@/db/packages";
import type { PackageType } from "@/lib/types";
import { PACKAGES_PATH, PROJECT_ROOT } from "@/lib/constants";
import { midenPackageMetadata } from "@/lib/miden-package-metadata";

export const activeToolchainVersion = async () => {
  const { stdout } = await execFile("midenup", ["--version"]);
  const activeToolchainVersionString = "active toolchain version";
  const versionIndex =
    stdout.indexOf(activeToolchainVersionString) +
    activeToolchainVersionString.length +
    2;
  const [major, minor, patch] = stdout.slice(versionIndex).split(".");
  return `${major}.${minor}.${patch}`;
};

export const cargoMidenVersion = async () => {
  const { stdout } = await execFile("cargo", ["miden", "--version"]);
  const [, version = ""] = stdout.split(" ").map((part) => part.trim());
  const [major, minor, patch] = version.split(".");
  return `${major}.${minor}.${patch}`;
};

export const packageExists = async (packageDir: string) =>
  fileExists(`${PACKAGES_PATH}/${packageDir}`);

export const newPackage = async ({
  name,
  type,
  example,
  rust,
  readOnly = false,
  dependencies = [],
}: {
  name: string;
  type: PackageType;
  example?: string;
  rust?: string;
  readOnly?: boolean;
  dependencies?: Dependency[];
}): Promise<{
  id: string;
  name: string;
  type: PackageType;
  rust: string;
  dependencies: Dependency[];
}> => {
  const initialRust = rust
    ? rust
    : await readFile(
        `${PROJECT_ROOT}/templates/${example ?? type}.rs`,
        "utf-8",
      );
  const id = await insertPackage({
    name,
    type,
    readOnly,
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
  return { id, name, type, rust: initialRust, dependencies };
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
        dependencies: [],
      });
    }),
  );
  await cp(
    `${PROJECT_ROOT}/templates/project-template`,
    `${PACKAGES_PATH}/${packageDir}`,
    {
      recursive: true,
    },
  );
  await Promise.all([
    writeFile(
      `${PACKAGES_PATH}/${packageDir}/miden-project.toml`,
      generateMidenProjectToml({
        name,
        type,
        rust,
        dependencies: dependenciesPackages,
      }),
    ),
    updateRust({ packageDir, name, rust }),
  ]);
  // await mkdir(`${PACKAGES_PATH}/${packageDir}/contracts/${name}`);
  // await Promise.all([
  //   addPackageToWorkspace({ packageDir, name }),
  //   mkdir(`${PACKAGES_PATH}/${packageDir}/contracts/${name}/src`),
  //   generateCargoToml({
  //     packageDir,
  //     name,
  //     type,
  //     dependencies: dependenciesPackages,
  //   }),
  // ]);
  // await updateRust({ packageDir, name, rust });
  // await mkdir(`${PACKAGES_PATH}/${packageDir}`);
  // await Promise.all([
  //   mkdir(`${PACKAGES_PATH}/${packageDir}/src`),
  //   generateCargoToml({
  //     packageDir,
  //     name,
  //     type,
  //     dependencies: dependenciesPackages,
  //   }),
  //   cp(
  //     `${PROJECT_ROOT}/templates/miden-toolchain.toml`,
  //     `${PACKAGES_PATH}/${packageDir}/miden-toolchain.toml`,
  //   ),
  //   cp(
  //     `${PROJECT_ROOT}/templates/rust-toolchain.toml`,
  //     `${PACKAGES_PATH}/${packageDir}/rust-toolchain.toml`,
  //   ),
  // ]);
  // await updateRust({ packageDir, rust });
};

// const addPackageToWorkspace = async ({
//   packageDir,
//   name,
// }: {
//   packageDir: string;
//   name: string;
// }) => {
//   const cargoToml = await readFile(
//     `${PACKAGES_PATH}/${packageDir}/Cargo.toml`,
//     "utf-8",
//   );
//   return writeFile(
//     `${PACKAGES_PATH}/${packageDir}/Cargo.toml`,
//     cargoToml.replace(
//       '"contracts/my-account-template"',
//       `"contracts/my-account-template", "contracts/${name}"`,
//     ),
//   );
// };

export const updateRust = ({
  packageDir,
  name,
  rust,
}: {
  packageDir: string;
  name: string;
  rust: string;
}) => {
  console.info(
    `cp rust ${PACKAGES_PATH}/${packageDir}/contracts/${name}/src/lib.rs`,
  );
  return writeFile(`${PACKAGES_PATH}/${packageDir}/src/lib.rs`, rust);
};

export const compilePackage = async ({
  packageDir,
  name,
}: {
  packageDir: string;
  name: string;
}) => {
  try {
    // console.info(
    //   `miden build --release --manifest-path contracts/${name}/Cargo.toml`,
    // );
    // const { stdout } = await execFile(
    //   "miden",
    //   [
    //     "build",
    //     "--release" /*, "--manifest-path", `contracts/${name}/Cargo.toml`*/,
    //   ],
    //   {
    //     cwd: `${PACKAGES_PATH}/${packageDir}`,
    //     env: { ...process.env, CARGO_TARGET_DIR: `${PACKAGES_PATH}/target` },
    //   },
    // );
    console.info("cargo miden build --release");
    const { stdout, stderr } = await execFile(
      "cargo",
      ["miden", "build", "--release"],
      {
        cwd: `${PACKAGES_PATH}/${packageDir}`,
        env: {
          ...process.env,
          CARGO_TARGET_DIR: `${PACKAGES_PATH}/target`,
          MIDENC_TARGET_DIR: `${PACKAGES_PATH}/target/${packageDir}`,
        },
      },
    );
    if (
      stdout === "" &&
      stderr !== "" &&
      !hasWarningThenFinished(stderr, name)
    ) {
      return { stdout: "", stderr };
    }
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
    manifest: {
      exports: Export[];
      dependencies: { name: string; digest: string }[];
    };
  };
  return {
    digest,
    exports: exports.filter(
      ({ Procedure: { signature } }) => signature?.abi === 3,
    ),
    dependencies: dependencies
      .filter(({ name }) => !["base", "std"].includes(name))
      .map((dependency) => ({
        // name is package id in camel case
        id: dependency.name.replaceAll("_", "-"),
        digest: dependency.digest,
      })),
  };
};

export const packagePath = ({
  packageDir,
  name,
}: {
  packageDir: string;
  name: string;
}) => `${PACKAGES_PATH}/target/${packageDir}/release/${name}.masp`;

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

export const parseMidenProjectToml = (midenProjectToml: string) =>
  parse(midenProjectToml) as MidenProjectToml;
