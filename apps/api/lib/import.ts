import { examples } from "@/examples";
import { notFound } from "@/lib/errors";
import { resolvePackageSources } from "@/lib/package-sources";
import type { CompiledPackage, PackageSource } from "@/lib/types";
import { compilePackage, createPackage } from "@/lib/utils";

export const importScriptsFromPackageSources = async (
  packageSources: Record<string, PackageSource>,
  {
    signal,
    ownerKeyHash,
  }: {
    signal?: AbortSignal;
    // The hash of the caller's owner token, which owns the new packages.
    ownerKeyHash: string;
  },
): Promise<CompiledPackage[]> => {
  const packages = resolvePackageSources(packageSources);
  const packageIds = new Map(
    await Promise.all(
      packages.map(
        async ({ name, type, masm }) =>
          [
            name,
            (await createPackage({ name, type, source: masm, ownerKeyHash }))
              .id,
          ] as const,
      ),
    ),
  );
  // api-compile builds one package at a time and answers 503 once its queue is
  // full, so compile the packages in turn rather than all at once, each one
  // after the packages it depends on.
  const compiledPackages: CompiledPackage[] = [];
  for (const { name, masm, dependencies } of packages) {
    compiledPackages.push(
      await compilePackage({
        id: packageIds.get(name) ?? "",
        source: masm,
        dependencies: dependencies.map(
          (dependency) => packageIds.get(dependency) ?? "",
        ),
        signal,
      }),
    );
  }
  return compiledPackages;
};

// Creates the packages of an example (examples/index.ts) and compiles them in
// turn, each after the ones it depends on, as an import does.
export const importExample = async (
  exampleId: string,
  { signal, ownerKeyHash }: { signal?: AbortSignal; ownerKeyHash: string },
): Promise<CompiledPackage[]> => {
  const example = Object.hasOwn(examples, exampleId)
    ? examples[exampleId as keyof typeof examples]
    : undefined;
  if (!example) {
    throw notFound("Error: Example not found.");
  }
  const packageIds = new Map<string, string>();
  const compiledPackages: CompiledPackage[] = [];
  for (const { name, type, masm, dependencies, metadata } of example.packages) {
    const { id } = await createPackage({
      name,
      type,
      source: masm,
      metadata,
      ownerKeyHash,
    });
    packageIds.set(name, id);
    compiledPackages.push(
      await compilePackage({
        id,
        source: masm,
        dependencies: dependencies.map(
          (dependency) => packageIds.get(dependency) ?? "",
        ),
        signal,
      }),
    );
  }
  return compiledPackages;
};
