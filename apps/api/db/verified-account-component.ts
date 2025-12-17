import db from "@/db";
import { verifiedAccountComponentTable } from "@/db/schema";

export const insertVerifiedAccountComponent = async ({
  accountId,
  packageId,
}: {
  accountId: string;
  packageId: string;
}) => {
  const [insertedVerifiedAccountComponent] = await db
    .insert(verifiedAccountComponentTable)
    .values({
      accountId,
      packageId,
    })
    .returning({ id: verifiedAccountComponentTable.id });
  if (!insertedVerifiedAccountComponent) {
    throw new Error("ERROR: insert verified account component failed");
  }
  return insertedVerifiedAccountComponent.id;
};
