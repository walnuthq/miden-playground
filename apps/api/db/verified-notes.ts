import db from "@/db";
import { verifiedNoteTable } from "@/db/schema";

export const getVerifiedNote = (noteId: string) =>
  db.query.verifiedNoteTable.findFirst({
    where: { noteId },
    with: { package: true },
  });

export const insertVerifiedNote = async ({
  noteId,
  packageId,
}: {
  noteId: string;
  packageId: string;
}) => {
  const [insertedVerifiedNote] = await db
    .insert(verifiedNoteTable)
    .values({
      noteId,
      packageId,
    })
    .returning({ id: verifiedNoteTable.id });
  if (!insertedVerifiedNote) {
    throw new Error("ERROR: insert verified note failed");
  }
  return insertedVerifiedNote.id;
};
