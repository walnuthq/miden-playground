import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { packagesTable } from "@/db/schema";
import {
  type DefaultDependency,
  defaultDependenciesRecords,
} from "@/lib/default-dependencies";
import type {
  Export,
  NewPackage,
  PackageMetadata,
  PackageStatus,
} from "@/lib/types";
import { isValidUUIDv4 } from "@/lib/uuid";

export const getPackage = async (id: string) => {
  const dbPackage = await getDb().query.packagesTable.findFirst({
    where: { id },
  });
  return dbPackage
    ? {
        ...dbPackage,
        files: dbPackage.files as Record<string, string>,
        metadata: dbPackage.metadata as PackageMetadata | null,
      }
    : undefined;
};

// Full rows, for a fork: in no particular order, without the missing ones.
export const getPackages = async (ids: string[]) => {
  if (ids.length === 0) {
    return [];
  }
  const dbPackages = await getDb().query.packagesTable.findMany({
    where: { id: { in: ids } },
  });
  return dbPackages.map((dbPackage) => ({
    ...dbPackage,
    files: dbPackage.files as Record<string, string>,
    exports: dbPackage.exports as Export[],
    metadata: dbPackage.metadata as PackageMetadata | null,
  }));
};

// A package and the packages it depends on, in turn: full rows, the package
// first. Undefined when it doesn't exist. Stops reading once there are more
// than `max`, which the caller refuses.
export const getPackageTree = async (id: string, max: number) => {
  const { packages, missing } = await getPackageForest([id], max);
  return missing.length > 0 ? undefined : packages;
};

// The same from several packages, roots first: a dependency they share is
// read once. `missing` lists the roots that don't exist.
export const getPackageForest = async (ids: string[], max: number) => {
  const roots = await getPackages([...new Set(ids)]);
  const found = new Map(roots.map((dbPackage) => [dbPackage.id, dbPackage]));
  const missing = ids.filter((id) => !found.has(id));
  let pending = roots.flatMap(({ dependencies }) => dependencies);
  while (pending.length > 0 && found.size <= max) {
    const batch = await getPackages([
      ...new Set(
        pending.filter(
          (dependency) => isValidUUIDv4(dependency) && !found.has(dependency),
        ),
      ),
    ]);
    pending = [];
    for (const dbPackage of batch) {
      found.set(dbPackage.id, dbPackage);
      pending.push(...dbPackage.dependencies);
    }
  }
  return { packages: [...found.values()], missing };
};

export const insertPackages = (newPackages: NewPackage[]) =>
  getDb().insert(packagesTable).values(newPackages);

// Makes the token's hash the owner of a package that has none. False when it
// got an owner meanwhile (or is gone).
export const claimPackage = async (id: string, ownerKeyHash: string) => {
  const claimed = await getDb()
    .update(packagesTable)
    .set({ ownerKeyHash })
    .where(and(eq(packagesTable.id, id), isNull(packagesTable.ownerKeyHash)))
    .returning({ id: packagesTable.id });
  return claimed.length > 0;
};

export const insertPackage = async (newPackage: NewPackage) => {
  const [insertedPackage] = await getDb()
    .insert(packagesTable)
    .values(newPackage)
    .returning({ id: packagesTable.id });
  if (!insertedPackage) {
    throw new Error("ERROR: insert package failed");
  }
  return insertedPackage.id;
};

export const updatePackage = ({
  id,
  status,
  files,
  masp,
  commitment,
  exports,
  dependencies,
  metadata,
}: {
  id: string;
  status?: PackageStatus;
  files?: Record<string, string>;
  masp?: string;
  commitment?: string;
  exports?: Export[];
  dependencies?: string[];
  metadata?: PackageMetadata | null;
}) =>
  getDb()
    .update(packagesTable)
    .set({
      status,
      files,
      masp,
      commitment,
      exports,
      dependencies,
      metadata,
    })
    .where(eq(packagesTable.id, id));

export const deletePackage = (id: string) =>
  getDb().delete(packagesTable).where(eq(packagesTable.id, id));

export const getDependencies = async (dependencies: string[]) => {
  const defaultDependencies = dependencies
    .filter(
      (dependency) =>
        !isValidUUIDv4(dependency) &&
        Object.hasOwn(defaultDependenciesRecords, dependency),
    )
    .map((dependency) => ({
      ...defaultDependenciesRecords[dependency as DefaultDependency],
      // Default dependencies have none.
      dependencies: [] as string[],
    }));
  const dbDependencies = await getDb().query.packagesTable.findMany({
    columns: {
      id: true,
      name: true,
      type: true,
      commitment: true,
      files: true,
      dependencies: true,
    },
    where: {
      id: {
        in: dependencies.filter((dependency) => isValidUUIDv4(dependency)),
      },
    },
  });
  return [
    ...defaultDependencies,
    ...dbDependencies.map((dbDependency) => ({
      ...dbDependency,
      files: dbDependency.files as Record<string, string>,
    })),
  ];
};

// The dependencies of a build: the given ones and, in turn, the ones they
// depend on. A package's miden-project.toml lists only its direct ones.
export const getDependenciesDeep = async (dependencies: string[]) => {
  const found = new Map<
    string,
    Awaited<ReturnType<typeof getDependencies>>[number]
  >();
  let pending = dependencies;
  while (pending.length > 0) {
    const batch = await getDependencies(pending);
    pending = [];
    for (const dependency of batch) {
      if (found.has(dependency.id)) {
        continue;
      }
      found.set(dependency.id, dependency);
      pending.push(...dependency.dependencies.filter((id) => !found.has(id)));
    }
  }
  return [...found.values()];
};
