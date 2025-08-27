"use client";
import { type Script, scriptTypes, scriptStatuses } from "@/lib/types";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";

export const columns: ColumnDef<Script>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => scriptTypes[row.original.type],
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "draft" ? "secondary" : "default"}
      >
        {scriptStatuses[row.original.status]}
      </Badge>
    ),
  },
];
