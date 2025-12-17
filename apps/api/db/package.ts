import { eq } from "drizzle-orm";
import db from "@/db";
import { packagesTable } from "@/db/schema";
import type { PackageType, PackageStatus, Export } from "@/lib/types";

export const getPackage = async (id: string) => {
  const result = await db.query.packagesTable.findFirst({ where: { id } });
  if (!result) {
    throw new Error("ERROR: get package failed");
  }
  return result;
};

export const insertPackage = async ({
  name,
  type,
  status,
  readOnly,
  rust,
}: {
  name: string;
  type: PackageType;
  status: PackageStatus;
  readOnly: boolean;
  rust: string;
}) => {
  const [insertedPackage] = await db
    .insert(packagesTable)
    .values({
      name,
      type,
      status,
      readOnly,
      rust,
    })
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
  exports,
  dependencies,
}: {
  id: string;
  status?: PackageStatus;
  rust?: string;
  exports?: Export[];
  dependencies?: string[];
}) =>
  db
    .update(packagesTable)
    .set({ status, rust, exports, dependencies })
    .where(eq(packagesTable.id, id));

export const deletePackage = (id: string) =>
  db.delete(packagesTable).where(eq(packagesTable.id, id));

export const getDependencies = (dependencies: string[]) =>
  db.query.packagesTable.findMany({
    columns: {
      id: true,
      name: true,
      type: true,
      digest: true,
      rust: true,
      dependencies: true,
    },
    where: { id: { in: dependencies } },
  });
