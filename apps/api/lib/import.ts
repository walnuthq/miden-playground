import { examples } from "@/examples";
import { sourcesHash } from "@/examples/hash";
import { notFound } from "@/lib/errors";
import { resolvePackageSources } from "@/lib/package-sources";
import type { CompiledPackage, Dependency, PackageSource } from "@/lib/types";
import { compilePackage, createPackage } from "@/lib/utils";

export const importScriptsFromPackageSources = async (
  packageSources: Record<string, PackageSource>,
  signal?: AbortSignal,
): Promise<CompiledPackage[]> => {
  const packages = resolvePackageSources(packageSources);
  const packageIds = new Map(
    await Promise.all(
      packages.map(
        async ({ name, type, rust }) =>
          [
            name,
            (await createPackage({ name, type, source: rust })).id,
          ] as const,
      ),
    ),
  );
  // api-compile builds one package at a time and answers 503 once its queue is
  // full, so compile the packages in turn rather than all at once, each one
  // after the packages it depends on.
  const compiledPackages: CompiledPackage[] = [];
  for (const { name, rust, dependencies } of packages) {
    compiledPackages.push(
      await compilePackage({
        id: packageIds.get(name) ?? "",
        source: rust,
        dependencies: dependencies.map(
          (dependency) => packageIds.get(dependency) ?? "",
        ),
        signal,
      }),
    );
  }
  return compiledPackages;
};

// Creates the packages of an example from its precompiled snapshot
// (examples/*/compiled.json), without calling api-compile. Falls back to
// compiling the sources when they were edited since the snapshot was taken.
export const importExample = async (
  exampleId: string,
  signal?: AbortSignal,
): Promise<CompiledPackage[]> => {
  const example = Object.hasOwn(examples, exampleId)
    ? examples[exampleId]
    : undefined;
  if (!example) {
    throw notFound("Error: Example not found.");
  }
  const { sources, compiled } = example;
  if ((await sourcesHash(sources)) !== compiled.sourcesHash) {
    console.warn(
      `Example ${exampleId}: sources changed since compiled.json was generated (run pnpm examples:compile), compiling them.`,
    );
    return importScriptsFromPackageSources(sources, signal);
  }
  const createdPackages = new Map<string, Dependency>();
  const compiledPackages: CompiledPackage[] = [];
  for (const { name, type, rust, dependencies } of resolvePackageSources(
    sources,
  )) {
    const compiledPackage = compiled.packages[name];
    if (!compiledPackage) {
      throw new Error(`Error: ${name} is missing from compiled.json.`);
    }
    const { masp, commitment, exports } = compiledPackage;
    // Snapshots taken before api-compile returned MASM have none.
    const masm = compiledPackage.masm ?? "";
    const packageDependencies = dependencies.map((dependency) => {
      const createdPackage = createdPackages.get(dependency);
      if (!createdPackage) {
        throw new Error(`Error: ${name} dependency ${dependency} not found.`);
      }
      return {
        ...createdPackage,
        // The commitment the package was compiled against.
        commitment:
          compiledPackage.dependencies.find(
            (compiledDependency) => compiledDependency.name === dependency,
          )?.commitment ?? createdPackage.commitment,
      };
    });
    const { id, files } = await createPackage({
      name,
      type,
      source: rust,
      dependencies: packageDependencies,
      compiled: { masm, masp, commitment, exports },
    });
    createdPackages.set(name, { id, name, type, commitment });
    compiledPackages.push({
      id,
      name,
      type,
      status: "compiled",
      files,
      error: "",
      warnings: "",
      masm,
      commitment,
      masp,
      exports,
      dependencies: packageDependencies,
    });
  }
  return compiledPackages;
};
