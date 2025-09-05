"use client";
import { type Component, componentTypes } from "@/lib/types";
import { type ColumnDef } from "@tanstack/react-table";
import useScripts from "@/hooks/use-scripts";

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
    cell: ({ row }) => {
      const { scripts } = useScripts();
      const script = scripts.find(({ id }) => id === row.original.scriptId);
      return script?.name;
    },
  },
];
