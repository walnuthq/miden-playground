"use client";
import { useIsClient } from "usehooks-ts";
import useNotes from "@/hooks/use-notes";
import NoteInformation from "@/components/note/note-information";
import ConsumeNoteButton from "@/components/note/consume-note-button";
import CreateTransactionDialog from "@/components/transactions/create-transaction-dialog";
import { noteWellKnownNote, noteConsumed } from "@/lib/types";

const Note = ({ id }: { id: string }) => {
  const isClient = useIsClient();
  const { inputNotes } = useNotes();
  const inputNote = inputNotes.find(
    (inputNote) => inputNote.inputNote.id().toString() === id,
  );
  if (!isClient || !inputNote) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex justify-end">
        {noteWellKnownNote(inputNote.inputNote) === "P2ID" &&
          !noteConsumed(inputNote.inputNote) && (
            <ConsumeNoteButton inputNote={inputNote.inputNote} />
          )}
      </div>
      <NoteInformation inputNote={inputNote} />
      <CreateTransactionDialog />
    </div>
  );
};

export default Note;
