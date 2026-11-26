import {
  getDependencies,
  getDependenciesDeep,
  getPackage,
  insertPackage,
  updatePackage,
} from "@/db/packages";
import { notFound } from "@/lib/errors";
import { analyzedExports, type ExportAnalysis } from "@/lib/package-exports";
import { buildFiles } from "@/lib/package-files";
import { type BuildMetadata, compiledMetadata } from "@/lib/package-metadata";
import { templates } from "@/lib/templates";
import { generateMidenProjectToml } from "@/lib/toml";
import type {
  CompiledPackage,
  Dependency,
  Diagnostic,
  Export,
  Manifest,
  PackageMetadata,
  PackageType,
  ScriptExample,
  ScriptFiles,
} from "@/lib/types";
import { fetchApiCompile } from "@/lib/upstream";
import {
  MANIFEST_FILE,
  scriptFilePaths,
  sourceFilePath,
} from "./source-file.ts";

// The package files the web app gets: its source and manifest, without the
// `<name>/` prefix they're stored under (the build's files are a project dir
// next to its dependencies').
export const scriptFiles = (
  name: string,
  files: Record<string, string>,
): ScriptFiles =>
  Object.fromEntries(
    scriptFilePaths(name).flatMap((path) => {
      const content = files[`${name}/${path}`];
      return content === undefined ? [] : [[path, content]];
    }),
  );

// A package's two files, under its `<name>/` directory: its MASM source and
// the miden-project.toml generated for it.
const packageFiles = ({
  name,
  type,
  source,
  dependencies,
}: {
  name: string;
  type: PackageType;
  source: string;
  dependencies: Dependency[];
}) => ({
  [`${name}/${sourceFilePath(name)}`]: source,
  [`${name}/${MANIFEST_FILE}`]: generateMidenProjectToml({
    name,
    type,
    masm: source,
    dependencies,
  }),
});

// Creates a package from its MASM source and returns its id and the files
// the web app shows.
export const createPackage = async ({
  name,
  type,
  source,
  dependencies = [],
  metadata = null,
  compiled,
  ownerKeyHash,
}: {
  name: string;
  type: PackageType;
  source: string;
  dependencies?: Dependency[];
  // A template's hand-written schemas (lib/template-schemas.ts), which the
  // package keeps while its source matches them.
  metadata?: PackageMetadata | null;
  // Compile output known ahead of time (an example's snapshot): the package
  // is inserted compiled instead of as a draft.
  compiled?: {
    masp: string;
    commitment: string;
    exports: Export[];
    metadata: PackageMetadata | null;
  };
  // The hash of the creator's owner token (lib/owner.ts).
  ownerKeyHash: string;
}) => {
  const files = packageFiles({ name, type, source, dependencies });
  const id = await insertPackage({
    name,
    type,
    dependencies: dependencies.map(({ id }) => id),
    files,
    ownerKeyHash,
    metadata,
    ...(compiled && { status: "compiled" as const, ...compiled }),
  });
  return { id, files: scriptFiles(name, files) };
};

// api-compile's answer to `POST /compile` for a MASM project (the MASM wire
// format, in the verifier repo's spec/remove-rust/README.md): a failed build
// is a 200 too, with its diagnostics alone.
type CompileOutput = {
  stdout: string;
  // The assembler's rendering of `diagnostics`.
  stderr: string;
  diagnostics?: Diagnostic[];
};

type CompileResponse =
  | ({ built: false } & CompileOutput)
  | ({
      built: true;
      masp: string;
      commitment: string;
      manifest: Manifest;
      // The project as sent.
      files: Record<string, string>;
      // The versions api-compile's assembler was built with.
      builtWith?: string;
      // Whether each exported procedure is read-only and calls another
      // account's procedure (FPI), and its parameters' names
      // (`analyzedExports`), and a script's account procedures.
    } & CompileOutput &
      ExportAnalysis &
      BuildMetadata);

const compileOutput = ({ stdout, stderr, diagnostics }: CompileOutput) => ({
  diagnostics: diagnostics ?? [],
  stdout,
  stderr,
});

export const compilePackage = async ({
  id,
  source,
  dependencies,
  signal,
}: {
  id: string;
  // The new MASM source.
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
  // Only the two files: whatever else an older row holds is dropped.
  const updatedFiles = packageFiles({
    name,
    type,
    source,
    dependencies: dependenciesPackages,
  });
  const files = buildFiles(updatedFiles, buildDependencies);
  // What the package's schemas are checked against (lib/package-metadata.ts).
  const compiledSource = {
    masm: source,
    shipped: (template: ScriptExample) =>
      template === "none" ? undefined : templates[template],
  };
  const build = await fetchApiCompile<CompileResponse>("/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files, entrypoint: name }),
    signal,
  });
  if (build.built === false) {
    console.error(build.stderr);
    // The schemas a package has stay through a failed build while the
    // source matches them; what the build read from the code doesn't.
    const metadata = compiledMetadata(dbPackage.metadata, {}, compiledSource);
    await updatePackage({
      id,
      status: "error",
      files: updatedFiles,
      dependencies,
      exports: [],
      metadata,
    });
    return {
      id,
      name,
      type,
      status: "error",
      files: scriptFiles(name, updatedFiles),
      ...compileOutput(build),
      error: build.stderr,
      warnings: "",
      masm: "",
      commitment: "",
      masp: "",
      exports: [],
      metadata,
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
    callsForeign,
    parameters,
    accountProcedures,
  } = build;
  const metadata = compiledMetadata(
    dbPackage.metadata,
    { accountProcedures },
    compiledSource,
  );
  const exports = analyzedExports(manifest, {
    readOnly,
    callsForeign,
    parameters,
  });
  // The `masm` column isn't written any more (the source is the MASM): it
  // keeps its default, "".
  await updatePackage({
    id,
    status: "compiled",
    files: updatedFiles,
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
    files: scriptFiles(name, updatedFiles),
    ...compileOutput(build),
    error: "",
    // A successful build still reports its warnings.
    warnings: stderr,
    masm: "",
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
