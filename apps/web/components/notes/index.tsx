"use client";
import { useIsClient } from "usehooks-ts";
import { columns } from "@/components/notes/columns";
import NotesTable from "@/components/notes/notes-table";
import useNotes from "@/hooks/use-notes";
import CreateTransactionDialog from "@/components/transactions/create-transaction-dialog";
import CreateNoteDialog from "@/components/notes/create-note-dialog";

const Notes = () => {
  const { inputNotes } = useNotes();
  const isClient = useIsClient();
  if (!isClient) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <NotesTable columns={columns} data={inputNotes} />
      <CreateTransactionDialog />
      <CreateNoteDialog />
    </div>
  );
};

export default Notes;
