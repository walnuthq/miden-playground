"use client";
import { useIsClient } from "usehooks-ts";
import { columns } from "@/components/scripts/columns";
import ScriptsTable from "@/components/scripts/scripts-table";
import useScripts from "@/hooks/use-scripts";
import CreateScriptDialog from "@/components/scripts/create-script-dialog";
import defaultScripts from "@/lib/types/default-scripts";
import DeleteScriptAlertDialog from "@/components/scripts/delete-script-alert-dialog";

const Scripts = () => {
  const { scripts } = useScripts();
  const isClient = useIsClient();
  if (!isClient) {
    return null;
  }
  const defaultScriptIds = defaultScripts.map(({ id }) => id);
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <ScriptsTable
        columns={columns}
        data={scripts.filter(({ id }) => !defaultScriptIds.includes(id))}
      />
      <CreateScriptDialog />
      <DeleteScriptAlertDialog />
    </div>
  );
};

export default Scripts;
