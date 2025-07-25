"use client";
import { MoreVertical } from "lucide-react";
import { type TableInputNote } from "@/lib/types";
import { formatId } from "@/lib/utils";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import useTransactions from "@/hooks/use-transactions";
import useNotes from "@/hooks/use-notes";
import {
  noteInputsToAccountId,
  noteWellKnownNote,
  noteConsumed,
} from "@/lib/types";
import AccountAddress from "@/components/lib/account-address";

const InputNoteActionsCell = ({
  inputNote: { id: noteId },
}: {
  inputNote: TableInputNote;
}) => {
  const { openCreateTransactionDialog, newConsumeTransactionRequest } =
    useTransactions();
  const { inputNotes } = useNotes();
  const inputNote = inputNotes.find(({ id }) => id === noteId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {inputNote &&
          noteWellKnownNote(inputNote.inputNote) === "P2ID" &&
          !noteConsumed(inputNote.inputNote) && (
            <DropdownMenuItem
              onClick={async () => {
                const targetAccountId = noteInputsToAccountId(
                  inputNote.inputNote.details().recipient().inputs()
                );
                const accountId = targetAccountId.toString();
                //setLoading(true);
                const transactionResult = await newConsumeTransactionRequest({
                  accountId,
                  noteIds: [noteId],
                });
                //setLoading(false);
                openCreateTransactionDialog({
                  accountId,
                  transactionType: "consume",
                  step: "preview",
                  transactionResult,
                });
              }}
            >
              Consume note
            </DropdownMenuItem>
          )}
        <DropdownMenuItem onClick={() => {}}>Export note</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns: ColumnDef<TableInputNote>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => formatId(row.original.id),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge
        variant={row.original.type === "Public" ? "default" : "destructive"}
      >
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "state",
    header: "State",
  },
  {
    accessorKey: "tag",
    header: "Tag",
  },
  {
    accessorKey: "senderAddress",
    header: "Sender ID",
    cell: ({ row }) => <AccountAddress address={row.original.senderAddress} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <InputNoteActionsCell inputNote={row.original} />,
  },
];
