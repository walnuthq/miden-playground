"use client";
import { MoreVertical } from "lucide-react";
import {
  type InputNote,
  noteConsumed,
  noteInputsToAccountId,
} from "@/lib/types";
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
import AccountAddress from "@/components/lib/account-address";

const InputNoteActionsCell = ({ inputNote }: { inputNote: InputNote }) => {
  const { openCreateTransactionDialog, newConsumeTransactionRequest } =
    useTransactions();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {inputNote.wellKnownNote === "P2ID" && !noteConsumed(inputNote) && (
          <DropdownMenuItem
            onClick={async () => {
              const targetAccountId = noteInputsToAccountId(inputNote.inputs);
              const accountId = targetAccountId.toString();
              const transactionResult = await newConsumeTransactionRequest({
                accountId,
                noteIds: [inputNote.id],
              });
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

export const columns: ColumnDef<InputNote>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => formatId(row.original.id),
  },
  {
    accessorKey: "type",
    header: "Storage mode",
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
