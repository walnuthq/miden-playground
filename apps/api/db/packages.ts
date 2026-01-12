import { eq } from "drizzle-orm";
import db from "@/db";
import { packagesTable } from "@/db/schema";
import type { NewPackage, PackageStatus, Export } from "@/lib/types";

export const getReadOnlyPackage = (digest: string) =>
  db.query.packagesTable.findFirst({ where: { digest, readOnly: true } });

export const getPackage = (id: string) =>
  db.query.packagesTable.findFirst({ where: { id } });

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
  masp,
  digest,
  exports,
  dependencies,
}: {
  id: string;
  status?: PackageStatus;
  rust?: string;
  masp?: string;
  digest?: string;
  exports?: Export[];
  dependencies?: string[];
}) =>
  db
    .update(packagesTable)
    .set({ status, rust, masp, digest, exports, dependencies })
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
