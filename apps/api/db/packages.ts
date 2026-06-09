import { eq } from "drizzle-orm";
import db from "@/db";
import { packagesTable } from "@/db/schema";
import type { NewPackage, PackageStatus, Export } from "@/lib/types";
import { isValidUUIDv4 } from "@/lib/utils";
import {
  defaultDependenciesRecords,
  type DefaultDependency,
} from "@/lib/default-dependencies";

export const getReadOnlyPackage = ({
  id,
  digest,
}: {
  id?: string;
  digest: string;
}) =>
  db.query.packagesTable.findFirst({
    where: {
      NOT: id ? { id } : undefined,
      digest,
      readOnly: true,
    },
  });

export const getPackage = async (id: string) => {
  const dbPackage = await db.query.packagesTable.findFirst({ where: { id } });
  return dbPackage
    ? { ...dbPackage, files: dbPackage.files as Record<string, string> }
    : undefined;
};

export const insertPackage = async (newPackage: NewPackage) => {
  const [insertedPackage] = await db
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
  digest,
  exports,
  dependencies,
}: {
  id: string;
  status?: PackageStatus;
  rust?: string;
  files?: Record<string, string>;
  masp?: string;
  digest?: string;
  exports?: Export[];
  dependencies?: string[];
}) =>
  db
    .update(packagesTable)
    .set({ status, rust, files, masp, digest, exports, dependencies })
    .where(eq(packagesTable.id, id));

export const deletePackage = (id: string) =>
  db.delete(packagesTable).where(eq(packagesTable.id, id));

export const getDependencies = async (dependencies: string[]) => {
  const defaultDependencies = dependencies
    .filter((dependency) => !isValidUUIDv4(dependency))
    .map((dependency) => ({
      ...defaultDependenciesRecords[dependency as DefaultDependency],
      rust: "",
      files: {} as Record<string, string>,
    }));
  const dbDependencies = await db.query.packagesTable.findMany({
    columns: {
      id: true,
      name: true,
      type: true,
      digest: true,
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
