import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { MoreVertical } from "lucide-react";
import ScriptStatusBadge from "@/components/scripts/script-status-badge";
import useScripts from "@/hooks/use-scripts";
import { exportScript } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/table";
import { type Script, scriptTypes } from "@/lib/types/script";

const ScriptActionsCell = ({ script }: { script: Script }) => {
  const { openDeleteScriptAlertDialog } = useScripts();
  const showActions = !script.readOnly && !script.id.includes("_");
  if (!showActions) {
    return null;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="size-8 p-0" />}
      >
        <span className="sr-only">Open menu</span>
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto" align="end">
        <DropdownMenuItem>
          <a href={exportScript(script.id)} download={`${script.name}.zip`}>
            Export script
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => openDeleteScriptAlertDialog(script.id)}
        >
          Delete script
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns: ColumnDef<DataTableFeatures, Script>[] = [
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
    cell: ({ row }) => <ScriptStatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <ScriptActionsCell script={row.original} />,
  },
];
