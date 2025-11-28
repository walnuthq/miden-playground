import { type Script } from "@/lib/types/script";
import ExportsTable from "@/components/script/exports-table";
import DependenciesTable from "@/components/script/dependencies-table";

const ScriptMetadata = ({ script }: { script: Script }) => (
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
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
        Package dependencies
      </h4>
      <DependenciesTable script={script} />
    </div>
  </div>
);

export default ScriptMetadata;
