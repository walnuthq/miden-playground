"use client";
import { useIsClient } from "usehooks-ts";
import { columns } from "@/components/notes/columns";
import NotesTable from "@/components/notes/notes-table";
import useNotes from "@/hooks/use-notes";
import CreateTransactionDialog from "@/components/transactions/create-transaction-dialog";

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
    </div>
  );
};

export default Notes;
