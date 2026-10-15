import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { packagesTable } from "@/db/schema";
import type { NewPackage, PackageStatus, Export } from "@/lib/types";
import { isValidUUIDv4 } from "@/lib/uuid";
import {
  defaultDependenciesRecords,
  type DefaultDependency,
} from "@/lib/default-dependencies";

export const getPackage = async (id: string) => {
  const dbPackage = await getDb().query.packagesTable.findFirst({ where: { id } });
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
  rust,
  files,
  masp,
  commitment,
  exports,
  dependencies,
}: {
  id: string;
  status?: PackageStatus;
  rust?: string;
  files?: Record<string, string>;
  masp?: string;
  commitment?: string;
  exports?: Export[];
  dependencies?: string[];
}) =>
  getDb()
    .update(packagesTable)
    .set({ status, rust, files, masp, commitment, exports, dependencies })
    .where(eq(packagesTable.id, id));

export const deletePackage = (id: string) =>
  getDb().delete(packagesTable).where(eq(packagesTable.id, id));

export const getDependencies = async (dependencies: string[]) => {
  const defaultDependencies = dependencies
    .filter((dependency) => !isValidUUIDv4(dependency))
    .map(
      (dependency) =>
        defaultDependenciesRecords[dependency as DefaultDependency],
    );
  const dbDependencies = await getDb().query.packagesTable.findMany({
    columns: {
      id: true,
      name: true,
      type: true,
      commitment: true,
      rust: true,
      files: true,
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
