"use client";
import { type Transaction } from "@/lib/types";
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
    accessorKey: "accountAddress",
    header: "Account ID",
    cell: ({ row }) => <AccountAddress address={row.original.accountAddress} />,
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
