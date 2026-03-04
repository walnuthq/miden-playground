import db from "@/db";
import { verifiedNoteTable } from "@/db/schema";

export const getVerifiedNote = ({
  noteId,
  packageId,
}: {
  noteId: string;
  packageId: string;
}) =>
  db.query.verifiedNoteTable.findFirst({
    where: { noteId, packageId },
  });

export const getVerifiedNotes = ({
  networkId,
  noteId,
}: {
  networkId: string;
  noteId: string;
}) =>
  db.query.verifiedNoteTable.findMany({
    where: { networkId, noteId },
    with: { package: true },
  });

export const insertVerifiedNote = async ({
  networkId,
  noteId,
  packageId,
}: {
  networkId: string;
  noteId: string;
  packageId: string;
}) => {
  const [insertedVerifiedNote] = await db
    .insert(verifiedNoteTable)
    .values({ networkId, noteId, packageId })
    .returning({ id: verifiedNoteTable.id });
  if (!insertedVerifiedNote) {
    throw new Error("ERROR: insert verified note failed");
  }
  return insertedVerifiedNote.id;
};
