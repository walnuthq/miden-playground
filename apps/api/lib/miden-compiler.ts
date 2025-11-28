import { cp, writeFile, readFile, rm, rename } from "node:fs/promises";
import { execFile, fileExists } from "@/lib/utils";

const packagesPath = process.env.PACKAGES_PATH ?? "/tmp";

export const cargoMidenVersion = async () => {
  const { stdout } = await execFile("cargo", ["miden", "--version"]);
  const [, semver] = stdout.split(" ");
  return semver!.replaceAll("\n", "");
};

// export const midenCompilerVersion = async () => {
//   const { stdout } = await execFile("midenc", ["--version"]);
//   const [, semver] = stdout.split(" ");
//   return semver!.replaceAll("\n", "");
// };

export const packageExists = async (packageDir: string) =>
  fileExists(`${packagesPath}/${packageDir}`);

// export const newPackage = (packageName: string) =>
//   execFile("cargo", ["miden", "new", packageName], { cwd: "/tmp" });

const createExamplesDir = async () => {
  await execFile("cargo", ["miden", "example", "p2id-note"], {
    cwd: packagesPath,
  });
  await execFile("cargo", ["miden", "example", "counter-contract"], {
    cwd: packagesPath,
  });
  await rename(`${packagesPath}/p2id-note`, `${packagesPath}/examples`);
  await cp(
    `${packagesPath}/counter-contract/counter-contract`,
    `${packagesPath}/examples/counter-contract`,
    { recursive: true }
  );
  await cp(
    `${packagesPath}/counter-contract/counter-note`,
    `${packagesPath}/examples/counter-note`,
    { recursive: true }
  );
  return rm(`${packagesPath}/counter-contract`, {
    recursive: true,
    force: true,
  });
};

export const newPackage = async ({
  packageDir,
  packageName,
  type,
  example,
}: {
  packageDir: string;
  packageName: string;
  type: string;
  example: string;
}) => {
  if (example !== "none") {
    const examplesDirExists = await fileExists(`${packagesPath}/examples`);
    if (!examplesDirExists) {
      console.info(`cp -r examples ${packagesPath}/examples`);
      await cp("examples", `${packagesPath}/examples`, {
        recursive: true,
      });
      console.info("cargo miden build --release");
      await execFile("cargo", ["miden", "build", "--release"], {
        cwd: `${packagesPath}/examples/counter-contract`,
      });
    }
    console.info(`cp -r examples/${example} ${packagesPath}/${packageDir}`);
    await cp(`examples/${example}`, `${packagesPath}/${packageDir}`, {
      recursive: true,
    });
    // if (example === "counter-note") {
    //   const cargoToml = await readFile(
    //     `${packagesPath}/${packageDir}/Cargo.toml`,
    //     "utf-8"
    //   );
    //   await writeFile(
    //     `${packagesPath}/${packageDir}/Cargo.toml`,
    //     cargoToml.replaceAll(
    //       "../counter-contract",
    //       `${packagesPath}/examples/counter-contract`
    //     )
    //   );
    // } else if (example === "p2id-note") {
    //   const cargoToml = await readFile(
    //     `${packagesPath}/${packageDir}/Cargo.toml`,
    //     "utf-8"
    //   );
    //   await writeFile(
    //     `${packagesPath}/${packageDir}/Cargo.toml`,
    //     cargoToml.replaceAll(
    //       "../basic-wallet",
    //       `${packagesPath}/examples/basic-wallet`
    //     )
    //   );
    // }
  }
};

export const readRust = async (packageDir: string) => {
  console.info(`cat ${packagesPath}/${packageDir}/src/lib.rs`);
  return readFile(`${packagesPath}/${packageDir}/src/lib.rs`, "utf-8");
};

export const updateRust = (packageDir: string, rust: string) => {
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
    "cargo",
    ["run", "--release", "--bin", "miden_package_introspection", maspPath],
    { cwd: "miden-package-introspection" }
  );
  const { exports, dependencies } = JSON.parse(stdout) as {
    exports: {
      name: string;
      digest: string;
      signature: { abi: number; params: string[]; results: string[] };
    }[];
    dependencies: { name: string; digest: string }[];
  };
  return {
    exports: exports.map((procedureExport) => {
      const [, name = ""] = procedureExport.name.split("::");
      return { ...procedureExport, name };
    }),
    dependencies,
  };
};

export const readPackage = async (packageDir: string) => {
  const cargoToml = await readFile(
    `${packagesPath}/${packageDir}/Cargo.toml`,
    "utf-8"
  );
  const matches = cargoToml.match(/name\s+=\s+"(.*)"/);
  if (!matches) {
    throw new Error("Cannot read package name");
  }
  const [, packageName] = matches;
  if (!packageName) {
    throw new Error("Cannot read package name");
  }
  const name = packageName.replaceAll("-", "_");
  const maspPath = `${packagesPath}/${packageDir}/target/miden/release/${name}.masp`;
  const packageBuffer = await readFile(maspPath);
  const { exports, dependencies } = await readPackageMetadata(maspPath);
  return { packageBuffer, exports, dependencies };
};

// export const compileWasmToMasm = async (packageDir: string) => {
//   const cargoToml = await readFile(
//     `${packagesPath}/${packageDir}/Cargo.toml`,
//     "utf-8"
//   );
//   const matches = cargoToml.match(/name\s+=\s+"(.*)"/);
//   if (!matches) {
//     throw new Error("Cannot read package name");
//   }
//   const [, packageName] = matches;
//   if (!packageName) {
//     throw new Error("Cannot read package name");
//   }
//   const name = packageName.replaceAll("-", "_");
//   console.info(
//     `midenc compile --emit masm=- target/wasm32-wasip2/release/${name}.wasm`
//   );
//   const { stdout: masm } = await execFile(
//     "midenc",
//     [
//       "compile",
//       "--emit",
//       "masm=-",
//       `target/wasm32-wasip2/release/${name}.wasm`,
//     ],
//     {
//       cwd: `${packagesPath}/${packageDir}`,
//     }
//   );
//   return masm;
// };

export const deletePackage = (packageDir: string) => {
  console.info(`rm -rf ${packagesPath}/${packageDir}`);
  return rm(`${packagesPath}/${packageDir}`, { recursive: true, force: true });
};
