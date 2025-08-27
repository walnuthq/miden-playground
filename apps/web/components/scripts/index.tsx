"use client";
import { useIsClient } from "usehooks-ts";
import { columns } from "@/components/scripts/columns";
import ScriptsTable from "@/components/scripts/scripts-table";
import useScripts from "@/hooks/use-scripts";
import CreateScriptDialog from "@/components/scripts/create-script-dialog";

const Scripts = () => {
  const { scripts } = useScripts();
  const isClient = useIsClient();
  if (!isClient) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <ScriptsTable columns={columns} data={scripts} />
      <CreateScriptDialog />
    </div>
  );
};

export default Scripts;
