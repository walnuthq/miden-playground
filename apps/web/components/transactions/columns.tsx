"use client";
import { type Transaction } from "@/lib/types/transaction";
import { formatId } from "@/lib/utils";
import { type ColumnDef } from "@tanstack/react-table";
import AccountAddress from "@/components/lib/account-address";

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => formatId(row.original.id),
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "accountId",
    header: "Account ID",
    cell: ({ row }) => <AccountAddress id={row.original.accountId} />,
  },
  {
    accessorKey: "scriptRoot",
    header: "Script Root",
    cell: ({ row }) => formatId(row.original.scriptRoot),
  },
  {
    accessorKey: "inputNotes.length",
    header: "Input Notes Count",
  },
  {
    accessorKey: "outputNotes.length",
    header: "Output Notes Count",
  },
];
