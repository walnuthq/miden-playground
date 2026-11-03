import { examples } from "@/examples";
import { sourcesHash } from "@/examples/hash";
import { parseMidenProjectToml } from "@/lib/toml";
import type { CompiledPackage, Dependency, PackageSource } from "@/lib/types";
import { compilePackage, createPackage } from "@/lib/utils";

const lastSegment = (path: string) => path.split("/").at(-1);

// Parses the packages' miden-project.toml and resolves their path dependencies
// to package names, then orders them so each package comes after the ones it
// depends on.
const resolvePackageSources = (
  packageSources: Record<string, PackageSource>,
) => {
  const packages = Object.entries(packageSources).map(
    ([packagePath, { midenProjectToml, rust }]) => {
      const {
        package: { name },
        dependencies,
        lib: { kind: type },
      } = parseMidenProjectToml(midenProjectToml);
      return { packagePath, name, type, rust, dependencies };
    },
  );
  const resolved = packages.map(({ name, type, rust, dependencies }) => ({
    name,
    type,
    rust,
    dependencies: Object.entries(dependencies)
      .filter(
        ([dependency]) =>
          dependency !== "miden-core" && dependency !== "miden-protocol",
      )
      .flatMap(([, dependency]) => {
        if (typeof dependency === "string") {
          return [];
        }
        const dependencyDir = lastSegment(dependency.path);
        const dependencyPackage = packages.find(
          ({ packagePath }) => lastSegment(packagePath) === dependencyDir,
        );
        return dependencyPackage ? [dependencyPackage.name] : [];
      }),
  }));
  const ordered: typeof resolved = [];
  const visiting = new Set<string>();
  const visit = (resolvedPackage: (typeof resolved)[number]) => {
    if (visiting.has(resolvedPackage.name)) {
      return;
    }
    visiting.add(resolvedPackage.name);
    for (const dependency of resolvedPackage.dependencies) {
      const dependencyPackage = resolved.find(
        ({ name }) => name === dependency,
      );
      if (dependencyPackage) {
        visit(dependencyPackage);
      }
    }
    ordered.push(resolvedPackage);
  };
  for (const resolvedPackage of resolved) {
    visit(resolvedPackage);
  }
  return ordered;
};

export const importScriptsFromPackageSources = async (
  packageSources: Record<string, PackageSource>,
  signal?: AbortSignal,
): Promise<CompiledPackage[]> => {
  const packages = resolvePackageSources(packageSources);
  const packageIds = new Map(
    await Promise.all(
      packages.map(
        async ({ name, type, rust }) =>
          [name, await createPackage({ name, type, rust })] as const,
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
        rust,
        dependencies: dependencies.map(
          (dependency) => packageIds.get(dependency) ?? "",
        ),
        signal,
      }),
    );
  }
  return compiledPackages;
};

export class ExampleNotFoundError extends Error {}

// Creates the packages of an example from its precompiled snapshot
// (examples/*/compiled.json), without calling api-compile. Falls back to
// compiling the sources when they were edited since the snapshot was taken.
export const importExample = async (
  exampleId: string,
  signal?: AbortSignal,
): Promise<CompiledPackage[]> => {
  const example = examples[exampleId];
  if (!example) {
    throw new ExampleNotFoundError("Error: Example not found.");
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
    const id = await createPackage({
      name,
      type,
      rust,
      dependencies: packageDependencies,
      compiled: { masm, masp, commitment, exports },
    });
    createdPackages.set(name, { id, name, type, commitment });
    compiledPackages.push({
      id,
      name,
      type,
      status: "compiled",
      rust,
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
