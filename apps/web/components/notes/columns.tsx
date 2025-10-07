"use client";
import { MoreVertical } from "lucide-react";
import {
  type InputNote,
  noteConsumed,
  noteStates,
  noteInputsToAccountId,
} from "@/lib/types/note";
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
import useScripts from "@/hooks/use-scripts";

const InputNoteActionsCell = ({ inputNote }: { inputNote: InputNote }) => {
  const { openCreateTransactionDialog, newConsumeTransactionRequest } =
    useTransactions();
  const { scripts } = useScripts();
  const script = scripts.find(({ root }) => root === inputNote.scriptRoot);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {script?.id === "p2id" && !noteConsumed(inputNote) && (
          <DropdownMenuItem
            onClick={async () => {
              const targetAccountId = noteInputsToAccountId(inputNote.inputs);
              const transactionResult = await newConsumeTransactionRequest({
                accountId: targetAccountId,
                noteIds: [inputNote.id],
              });
              openCreateTransactionDialog({
                accountId: targetAccountId,
                transactionType: "consume",
                step: "preview",
                transactionResult,
              });
            }}
          >
            Consume note
          </DropdownMenuItem>
        )}
        <DropdownMenuItem disabled onClick={() => {}}>
          Export note
        </DropdownMenuItem>
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
        variant={row.original.type === "public" ? "default" : "destructive"}
        className="capitalize"
      >
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "state",
    header: "State",
    cell: ({ row }) => noteStates[row.original.state],
  },
  {
    accessorKey: "tag",
    header: "Tag",
  },
  {
    accessorKey: "senderId",
    header: "Sender ID",
    cell: ({ row }) => <AccountAddress id={row.original.senderId} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <InputNoteActionsCell inputNote={row.original} />,
  },
];
