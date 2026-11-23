import type { Dependency, Package } from "@/lib/types";
import { isValidUUIDv4 } from "./uuid.ts";

// A fork: copies of a package and of every package it depends on, in turn,
// under new ids, owned by the caller. The copies keep their compiled outputs:
// the sources are the same, and a package finds its dependencies by name
// (`../<name>` in its miden-project.toml), not by id. Built-in dependencies
// (`builtIns`, by their non-UUID ids) aren't rows: they're kept as they are.
// A dependency that was deleted is dropped from its dependents.
export const forkPackages = ({
  rootId,
  ...rest
}: {
  rootId: string;
  // The package and its dependencies, deep, in any order.
  packages: Package[];
  builtIns: Record<string, Dependency>;
  newId: () => string;
  ownerKeyHash: string;
}) => {
  const { ids, copies } = forkPackageForest(rest);
  return { id: ids.get(rootId) ?? "", copies };
};

// The same for several packages at once: a dependency they share is copied
// once, so their copies point at the same copy of it. `ids` maps each package
// to its copy.
export const forkPackageForest = ({
  packages,
  builtIns,
  newId,
  ownerKeyHash,
}: {
  // The packages and their dependencies, deep, in any order.
  packages: Package[];
  builtIns: Record<string, Dependency>;
  newId: () => string;
  ownerKeyHash: string;
}) => {
  const ids = new Map(packages.map(({ id }) => [id, newId()]));
  const byId = new Map(packages.map((dbPackage) => [dbPackage.id, dbPackage]));
  const dependency = (id: string): Dependency[] => {
    const dbPackage = byId.get(id);
    const forkedId = ids.get(id);
    if (dbPackage && forkedId) {
      const { name, type, commitment } = dbPackage;
      return [{ id: forkedId, name, type, commitment }];
    }
    const builtIn =
      !isValidUUIDv4(id) && Object.hasOwn(builtIns, id)
        ? builtIns[id]
        : undefined;
    if (builtIn) {
      const { name, type, commitment } = builtIn;
      return [{ id, name, type, commitment }];
    }
    return [];
  };
  const copies = packages.map(
    ({
      id,
      name,
      type,
      status,
      files,
      masm,
      commitment,
      masp,
      exports,
      metadata,
      dependencies,
    }) => {
      const forkedDependencies = dependencies.flatMap(dependency);
      return {
        row: {
          id: ids.get(id) ?? "",
          name,
          type,
          status,
          files,
          masm,
          commitment,
          masp,
          exports,
          metadata,
          dependencies: forkedDependencies.map(({ id }) => id),
          ownerKeyHash,
        },
        dependencies: forkedDependencies,
      };
    },
  );
  return { ids, copies };
};
