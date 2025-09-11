"use client";
import { type Script, scriptTypes, scriptStatuses } from "@/lib/types";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreVertical } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import useScripts from "@/hooks/use-scripts";

const ScriptActionsCell = ({ script }: { script: Script }) => {
  const { openDeleteScriptAlertDialog } = useScripts();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => openDeleteScriptAlertDialog(script.id)}
        >
          Delete script
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

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
  {
    id: "actions",
    cell: ({ row }) => <ScriptActionsCell script={row.original} />,
  },
];
