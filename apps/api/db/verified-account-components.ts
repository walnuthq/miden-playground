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

export const getVerifiedAccountComponents = ({
  networkId,
  identifier,
}: {
  networkId: string;
  identifier: string;
}) =>
  db.query.verifiedAccountComponentTable.findMany({
    where: { networkId, identifier },
    with: { package: true },
  });

export const insertVerifiedAccountComponent = async ({
  networkId,
  identifier,
  accountId,
  packageId,
}: {
  networkId: string;
  identifier: string;
  accountId: string;
  packageId: string;
}) => {
  const [insertedVerifiedAccountComponent] = await db
    .insert(verifiedAccountComponentTable)
    .values({
      networkId,
      identifier,
      accountId,
      packageId,
    })
    .returning({ id: verifiedAccountComponentTable.id });
  if (!insertedVerifiedAccountComponent) {
    throw new Error("ERROR: insert verified account component failed");
  }
  return insertedVerifiedAccountComponent.id;
};
