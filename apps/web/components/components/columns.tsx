"use client";
import { type Component, componentTypes } from "@/lib/types/component";
import { type ColumnDef } from "@tanstack/react-table";
import useScripts from "@/hooks/use-scripts";

const ScriptCell = ({ scriptId }: { scriptId: string }) => {
  const { scripts } = useScripts();
  const script = scripts.find(({ id }) => id === scriptId);
  return script?.name;
};

export const columns: ColumnDef<Component>[] = [
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
    cell: ({ row }) => componentTypes[row.original.type],
  },
  {
    accessorKey: "script",
    header: "Script",
    cell: ({ row }) => <ScriptCell scriptId={row.original.scriptId} />,
  },
];
