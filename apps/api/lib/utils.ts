import {
  getDependencies,
  getPackage,
  insertPackage,
  updatePackage,
} from "@/db/packages";
import { projectTemplateFiles } from "@/lib/templates";
import { generateCargoToml, generateMidenProjectToml } from "@/lib/toml";
import type {
  CompiledPackage,
  Dependency,
  Manifest,
  PackageType,
} from "@/lib/types";
import { fetchApiCompile } from "@/lib/upstream";

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
    [`${name}/build.rs`]: projectTemplateFiles["build.rs"],
    [`${name}/Cargo.toml`]: generateCargoToml({ name }),
    [`${name}/Cargo.lock`]: projectTemplateFiles["Cargo.lock"],
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

type CompileResponse = {
  stdout: string;
  stderr: string;
  masp: string;
  commitment: string;
  manifest: Manifest;
  // Set when the build succeeded: the sources plus the lockfile it used.
  files?: Record<string, string>;
};

export const compilePackage = async ({
  id,
  rust,
  dependencies,
  signal,
}: {
  id: string;
  rust: string;
  dependencies: string[];
  signal?: AbortSignal;
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
  const {
    stdout,
    stderr,
    masp,
    commitment,
    manifest,
    files: compiledFiles,
  } = await fetchApiCompile<CompileResponse>("/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files, entrypoint: name }),
    signal,
  });
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
      commitment: "",
      masp: "",
      exports: [],
      dependencies: dependenciesPackages.map(
        ({ id, name, type, commitment }) => ({
          id,
          name,
          type,
          commitment,
        }),
      ),
    };
  }
  const exports = manifest.exports.filter(
    ({ Procedure: { signature } }) => signature?.abi === 3,
  );
  await updatePackage({
    id,
    status: "compiled",
    rust,
    // The compiled sources plus the Cargo.lock the build used, sent back with
    // the next compile to get the same dependency versions.
    files: compiledFiles ?? updatedFiles,
    masp,
    commitment,
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
    commitment,
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
        // The manifest still calls the dependency commitment `digest`.
        commitment: dependency?.digest ?? "",
      };
    }),
  };
};
