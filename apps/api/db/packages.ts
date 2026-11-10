import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { packagesTable } from "@/db/schema";
import {
  type DefaultDependency,
  defaultDependenciesRecords,
} from "@/lib/default-dependencies";
import type { Export, NewPackage, PackageStatus } from "@/lib/types";
import { isValidUUIDv4 } from "@/lib/uuid";

export const getPackage = async (id: string) => {
  const dbPackage = await getDb().query.packagesTable.findFirst({
    where: { id },
  });
  return dbPackage
    ? { ...dbPackage, files: dbPackage.files as Record<string, string> }
    : undefined;
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
  masm,
  masp,
  commitment,
  exports,
  dependencies,
}: {
  id: string;
  status?: PackageStatus;
  files?: Record<string, string>;
  masm?: string;
  masp?: string;
  commitment?: string;
  exports?: Export[];
  dependencies?: string[];
}) =>
  getDb()
    .update(packagesTable)
    .set({
      status,
      files,
      masm,
      masp,
      commitment,
      exports,
      dependencies,
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
