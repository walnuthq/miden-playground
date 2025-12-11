import { Plus } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { type Script } from "@/lib/types/script";
import ExportsTable from "@/components/script/exports-table";
import DependenciesTable from "@/components/script/dependencies-table";
import useScripts from "@/hooks/use-scripts";

const ScriptMetadata = ({ script }: { script: Script }) => {
  const { openAddDependencyDialog } = useScripts();
  return (
    <div className="flex flex-col gap-8">
      {script.exports.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            Package exports
          </h4>
          <ExportsTable script={script} />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            Package dependencies
          </h4>
          {!script.readOnly && (
            <Button
              variant="outline"
              onClick={() => openAddDependencyDialog({ scriptId: script.id })}
            >
              <Plus />
              <span className="hidden lg:inline">Add dependency</span>
            </Button>
          )}
        </div>
        <DependenciesTable script={script} />
      </div>
    </div>
  );
};

export default ScriptMetadata;
