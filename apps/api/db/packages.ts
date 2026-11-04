import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { packagesTable } from "@/db/schema";
import {
  type DefaultDependency,
  defaultDependenciesRecords,
} from "@/lib/default-dependencies";
import { toPackageType } from "@/lib/package-type";
import type {
  DbPackageType,
  Export,
  NewPackage,
  PackageStatus,
  PackageType,
} from "@/lib/types";
import { isValidUUIDv4 } from "@/lib/uuid";

// A stored type, the legacy "tx-script" read as "transaction-script".
const storedPackageType = (type: DbPackageType): PackageType =>
  toPackageType(type) ?? "library";

export const getPackage = async (id: string) => {
  const dbPackage = await getDb().query.packagesTable.findFirst({
    where: { id },
  });
  return dbPackage
    ? {
        ...dbPackage,
        type: storedPackageType(dbPackage.type),
        files: dbPackage.files as Record<string, string>,
      }
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
      type: storedPackageType(dbDependency.type),
      files: dbDependency.files as Record<string, string>,
    })),
  ];
};
