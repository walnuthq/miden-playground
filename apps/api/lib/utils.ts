import {
  getDependencies,
  getDependenciesDeep,
  getPackage,
  insertPackage,
  updatePackage,
} from "@/db/packages";
import { notFound } from "@/lib/errors";
import { buildFiles, ownFiles } from "@/lib/package-files";
import { packageMetadata } from "@/lib/package-metadata";
import { projectTemplateFiles } from "@/lib/templates";
import { generateCargoToml, generateMidenProjectToml } from "@/lib/toml";
import {
  type CompiledPackage,
  type Dependency,
  type Export,
  type Manifest,
  type PackageMetadata,
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
    metadata: PackageMetadata | null;
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

// The release build's Miden Assembly, sent for `masm: true`: its `error` when
// unavailable (or over api-compile's 4 MiB limit).
type MasmOutput = { source: string } | { error: string };

// api-compile's answer to `POST /compile`: a failed build is a 200 too, with
// cargo-miden's output alone.
type CompileResponse =
  | { built: false; stdout: string; stderr: string }
  | ({
      built: true;
      stdout: string;
      stderr: string;
      masp: string;
      commitment: string;
      manifest: Manifest;
      // Whether each exported procedure is read-only, by export path: `null`
      // when it can't be told.
      readOnly: Record<string, boolean | null>;
      // The sources plus the lockfile the build used.
      files: Record<string, string>;
      masm?: MasmOutput;
      // An account component's storage slots, a note's storage fields and a
      // script's account procedures: absent for other packages, and from an
      // api-compile older than them.
    } & PackageMetadata);

// The MASM tab's content: for reading only, it calls library procedures
// without including them, so it doesn't reassemble into the package.
const masmSource = (masm?: MasmOutput) =>
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
  const [dbPackage, dependenciesPackages, buildDependencies] =
    await Promise.all([
      getPackage(id),
      getDependencies(dependencies),
      getDependenciesDeep(dependencies),
    ]);
  if (!dbPackage) {
    throw notFound("Error: Package not found.");
  }
  const { name, type } = dbPackage;
  const updatedFiles = ownFiles(name, dbPackage.files);
  updatedFiles[`${name}/src/lib.rs`] = source;
  updatedFiles[`${name}/miden-project.toml`] = generateMidenProjectToml({
    name,
    type,
    rust: source,
    dependencies: dependenciesPackages,
  });
  const files = buildFiles(updatedFiles, buildDependencies);
  const build = await fetchApiCompile<CompileResponse>("/compile", {
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
  if (build.built === false) {
    console.error(build.stderr);
    await updatePackage({
      id,
      status: "error",
      files: updatedFiles,
      // No MASM for code that doesn't build.
      masm: "",
      dependencies,
      exports: [],
      // Nor schemas: the last build's would describe other code.
      metadata: null,
    });
    return {
      id,
      name,
      type,
      status: "error",
      files: scriptFiles(name, updatedFiles),
      error: build.stderr,
      warnings: "",
      masm: "",
      commitment: "",
      masp: "",
      exports: [],
      metadata: null,
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
  const {
    stderr,
    masp,
    commitment,
    manifest,
    readOnly,
    storage,
    noteStorage,
    accountProcedures,
    files: storedFiles,
    masm: masmOutput,
  } = build;
  const metadata = packageMetadata({
    storage,
    noteStorage,
    accountProcedures,
  });
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
  const packageFiles = ownFiles(name, storedFiles);
  // The package's own compiled sources plus the Cargo.lock the build used are
  // sent back with the next compile to get the same dependency versions.
  await updatePackage({
    id,
    status: "compiled",
    files: packageFiles,
    masm,
    masp,
    commitment,
    exports,
    dependencies,
    metadata,
  });
  return {
    id,
    name,
    type,
    status: "compiled",
    files: scriptFiles(name, packageFiles),
    error: "",
    // A successful build still reports its warnings on stderr.
    warnings: stderr,
    masm,
    commitment,
    masp,
    exports,
    metadata,
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
