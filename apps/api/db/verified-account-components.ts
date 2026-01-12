import db from "@/db";
import { verifiedAccountComponentTable } from "@/db/schema";

export const getVerifiedAccountComponent = ({
  accountId,
  packageId,
}: {
  accountId: string;
  packageId: string;
}) =>
  db.query.verifiedAccountComponentTable.findFirst({
    where: { accountId, packageId },
  });

export const getVerifiedAccountComponents = (address: string) =>
  db.query.verifiedAccountComponentTable.findMany({
    where: { address },
    with: { package: true },
  });

export const insertVerifiedAccountComponent = async ({
  accountId,
  packageId,
  address,
}: {
  accountId: string;
  packageId: string;
  address: string;
}) => {
  const [insertedVerifiedAccountComponent] = await db
    .insert(verifiedAccountComponentTable)
    .values({
      accountId,
      packageId,
      address,
    })
    .returning({ id: verifiedAccountComponentTable.id });
  if (!insertedVerifiedAccountComponent) {
    throw new Error("ERROR: insert verified account component failed");
  }
  return insertedVerifiedAccountComponent.id;
};
