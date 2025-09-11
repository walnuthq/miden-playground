import { access, constants, writeFile, readFile, rm } from "node:fs/promises";
import { execFile } from "@/lib/utils";

export const cargoMidenVersion = async () => {
  const { stdout } = await execFile("cargo", ["miden", "--version"]);
  const [, semver] = stdout.split(" ");
  return semver!.replaceAll("\n", "");
};

export const midenCompilerVersion = async () => {
  const { stdout } = await execFile("midenc", ["--version"]);
  const [, semver] = stdout.split(" ");
  return semver!.replaceAll("\n", "");
};

export const packageExists = async (packageName: string) => {
  try {
    await access(`/tmp/${packageName}`, constants.F_OK);
    return true; // eslint-disable-next-line
  } catch (_) {
    return false;
  }
};

export const newPackage = (packageName: string) =>
  execFile("cargo", ["miden", "new", packageName], { cwd: "/tmp" });

export const readRust = async (packageName: string) =>
  readFile(`/tmp/${packageName}/src/lib.rs`, "utf-8");

export const updateRust = (packageName: string, source: string) =>
  writeFile(`/tmp/${packageName}/src/lib.rs`, source);

export const compilePackage = async (packageName: string) => {
  try {
    const { stdout } = await execFile(
      "cargo",
      ["miden", "build", "--release"],
      {
        cwd: `/tmp/${packageName}`,
      }
    );
    return { stdout, stderr: "" };
  } catch (error) {
    const { stderr } = error as { stderr: string };
    return { stdout: "", stderr };
  }
};

export const compileWasmToMasm = (packageName: string) =>
  execFile(
    "midenc",
    [
      "compile",
      "--emit",
      `masm=${packageName}.masm`,
      `target/wasm32-wasip2/release/${packageName.replaceAll("-", "_")}.wasm`,
    ],
    {
      cwd: `/tmp/${packageName}`,
    }
  );

export const readMasm = async (packageName: string) => {
  const packageFile = await readFile(`/tmp/${packageName}/Cargo.toml`, "utf-8");
  const matches = packageFile.match(/package\s+=\s+"(.*)"/);
  if (!matches) {
    return "";
  }
  const [, componentName] = matches;
  const [actualPackageName] = packageName.split("-");
  return readFile(
    `/tmp/${packageName}/${componentName}/${actualPackageName}@0.1.masm`,
    "utf-8"
  );
};

export const deletePackage = (packageName: string) =>
  rm(packageName, { recursive: true, force: true });
