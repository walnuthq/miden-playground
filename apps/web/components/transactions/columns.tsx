import type { ColumnDef } from "@tanstack/react-table";
import AccountAddress from "@/components/lib/account-address";
import type { DataTableFeatures } from "@/lib/table";
import type { Transaction } from "@/lib/types/transaction";
import { formatId } from "@/lib/utils";

// Columns the table hides on phones (`mobileColumnClassName`), by column id
// (an accessor key with its dots replaced by underscores).
export const mobileHiddenColumns = [
  "accountId",
  "scriptRoot",
  "inputNotes.length",
  "outputNotes.length",
];

export const columns: ColumnDef<DataTableFeatures, Transaction>[] = [
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
    header: "Input Notes",
  },
  {
    accessorKey: "outputNotes.length",
    header: "Output Notes",
  },
];
