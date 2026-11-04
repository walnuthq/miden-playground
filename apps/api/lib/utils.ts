import {
  getDependencies,
  getPackage,
  insertPackage,
  updatePackage,
} from "@/db/packages";
import { projectTemplateFiles } from "@/lib/templates";
import { generateCargoToml, generateMidenProjectToml } from "@/lib/toml";
import {
  type CompiledPackage,
  type Dependency,
  type Export,
  type Manifest,
  type PackageType,
  type ScriptFiles,
  scriptFilePaths,
} from "@/lib/types";
import { fetchApiCompile } from "@/lib/upstream";

// The package files the web app gets: its source and manifests, without the
// `<name>/` prefix they're stored under (the build's files are a project dir
// next to its dependencies').
export const scriptFiles = (
  name: string,
  files: Record<string, string>,
): ScriptFiles =>
  Object.fromEntries(
    scriptFilePaths.flatMap((path) => {
      const content = files[`${name}/${path}`];
      return content === undefined ? [] : [[path, content]];
    }),
  );

// The source of a package, from its stored files.
export const packageSource = (name: string, files: Record<string, string>) =>
  files[`${name}/src/lib.rs`] ?? "";

// Creates a package from its source (`src/lib.rs`), with the project files
// around it, and returns its id and the files the web app shows.
export const createPackage = async ({
  name,
  type,
  source,
  dependencies = [],
  compiled,
}: {
  name: string;
  type: PackageType;
  source: string;
  dependencies?: Dependency[];
  // Compile output known ahead of time (examples/*/compiled.json): the package
  // is inserted compiled instead of as a draft.
  compiled?: {
    masm: string;
    masp: string;
    commitment: string;
    exports: Export[];
  };
}) => {
  const files = {
    [`${name}/.cargo/config.toml`]: projectTemplateFiles[".cargo/config.toml"],
    [`${name}/src/lib.rs`]: source,
    [`${name}/build.rs`]: projectTemplateFiles["build.rs"],
    [`${name}/Cargo.toml`]: generateCargoToml({ name }),
    [`${name}/Cargo.lock`]: projectTemplateFiles["Cargo.lock"],
    [`${name}/miden-project.toml`]: generateMidenProjectToml({
      name,
      type,
      rust: source,
      dependencies,
    }),
    [`${name}/rust-toolchain.toml`]:
      projectTemplateFiles["rust-toolchain.toml"],
  };
  const id = await insertPackage({
    name,
    type,
    dependencies: dependencies.map(({ id }) => id),
    files,
    ...(compiled && { status: "compiled" as const, ...compiled }),
  });
  return { id, files: scriptFiles(name, files) };
};

type CompileResponse = {
  stdout: string;
  stderr: string;
  masp: string;
  commitment: string;
  manifest: Manifest;
  // Whether each exported procedure is read-only, by export path: `null` when
  // it can't be told. Missing from an api-compile that predates it.
  readOnly?: Record<string, boolean | null>;
  // Set when the build succeeded: the sources plus the lockfile it used.
  files?: Record<string, string>;
  // The release build's Miden Assembly, sent for `masm: true`: its `error` when
  // unavailable (or over api-compile's 4 MiB limit). Missing from an
  // api-compile that predates it.
  masm?: { source: string } | { error: string };
};

// The MASM tab's content: for reading only, it calls library procedures
// without including them, so it doesn't reassemble into the package.
const masmSource = (masm: CompileResponse["masm"]) =>
  masm && "source" in masm ? masm.source : "";

export const compilePackage = async ({
  id,
  source,
  dependencies,
  signal,
}: {
  id: string;
  // The new `src/lib.rs`.
  source: string;
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
  updatedFiles[`${name}/src/lib.rs`] = source;
  updatedFiles[`${name}/miden-project.toml`] = generateMidenProjectToml({
    name,
    type,
    rust: source,
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
    readOnly = {},
    files: compiledFiles,
    masm: masmOutput,
  } = await fetchApiCompile<CompileResponse>("/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // A stored lockfile can pin other crate versions than api-compile's warm
    // cache (it moves with api-compile's own lockfiles): re-resolve it against
    // the cache rather than download and rebuild them. The build sends the
    // updated lockfile back, stored below.
    // `masm`: also return the build's Miden Assembly, for the MASM tab.
    body: JSON.stringify({
      files,
      entrypoint: name,
      warmLockfile: true,
      masm: true,
    }),
    signal,
  });
  if (stdout === "" && stderr !== "") {
    console.error(stderr);
    await updatePackage({
      id,
      status: "error",
      files: updatedFiles,
      // No MASM for code that doesn't build.
      masm: "",
      dependencies,
      exports: [],
    });
    return {
      id,
      name,
      type,
      status: "error",
      files: scriptFiles(name, updatedFiles),
      error: stderr,
      warnings: "",
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
  const exports = manifest.exports
    .filter(({ Procedure: { signature } }) => signature?.abi === 3)
    // Stored with each export, in the `exports` column.
    .map(({ Procedure: procedureExport }) => ({
      Procedure: {
        ...procedureExport,
        readOnly: readOnly[procedureExport.path],
      },
    }));
  if (masmOutput && "error" in masmOutput) {
    console.warn(`${name}: no MASM (${masmOutput.error})`);
  }
  const masm = masmSource(masmOutput);
  // The compiled sources plus the Cargo.lock the build used, sent back with the
  // next compile to get the same dependency versions.
  const storedFiles = compiledFiles ?? updatedFiles;
  await updatePackage({
    id,
    status: "compiled",
    files: storedFiles,
    masm,
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
    files: scriptFiles(name, storedFiles),
    error: "",
    // A successful build still reports its warnings on stderr.
    warnings: stderr,
    masm,
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
