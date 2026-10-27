import { useIsClient } from "usehooks-ts";
import { columns } from "@/components/scripts/columns";
import CreateScriptDialog from "@/components/scripts/create-script-dialog";
import DeleteScriptAlertDialog from "@/components/scripts/delete-script-alert-dialog";
import ImportProjectDialog from "@/components/scripts/import-project-dialog";
import ScriptsTable from "@/components/scripts/scripts-table";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";

const Scripts = () => {
  const { scripts } = useScripts();
  const isClient = useIsClient();
  if (!isClient) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <ScriptsTable
        columns={columns}
        data={scripts.filter(({ id }) => !defaultScriptIds.includes(id))}
      />
      <ImportProjectDialog />
      <CreateScriptDialog />
      <DeleteScriptAlertDialog />
    </div>
  );
};

export default Scripts;
