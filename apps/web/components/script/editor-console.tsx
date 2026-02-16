import { useState } from "react";
import { Play } from "lucide-react";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { defaultProcedureExport, type Script } from "@/lib/types/script";
import useScripts from "@/hooks/use-scripts";
import { cn } from "@workspace/ui/lib/utils";
import { compileScript } from "@/lib/api";
import { formatProcedureExportPath } from "@/lib/utils";

const EditorConsole = ({ script }: { script: Script }) => {
  const { scripts, updateScript } = useScripts();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const compile = async () => {
    setLoading(true);
    const { error, masm, digest, masp, procedureExports, dependencies } =
      await compileScript(script);
    updateScript(script.id, {
      error,
      masm,
      status: error ? "error" : "compiled",
      digest,
      masp,
      procedureExports: error
        ? script.procedureExports
        : procedureExports.map((procedureExport) => ({
            ...defaultProcedureExport(),
            ...procedureExport,
            readOnly: formatProcedureExportPath(
              procedureExport.path,
            ).startsWith("get"),
          })),
      dependencies: error
        ? script.dependencies
        : dependencies
            .map((dependency) => {
              if (
                dependency.digest ===
                "0xc414a8aa918aa163c89b4543fac58500189e4bed24630806f276d49665c692a3"
              ) {
                return { ...dependency, id: "basic-wallet" };
              }
              const scriptDependency = scripts.find(
                ({ id, digest }) =>
                  id === dependency.id || digest === dependency.digest,
              );
              return scriptDependency
                ? {
                    ...dependency,
                    id: scriptDependency.id,
                  }
                : undefined;
            })
            .filter((dependency) => dependency !== undefined),
    });
    setContent(error ? error : "Script compiled successfully.");
    setLoading(false);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor Console</CardTitle>
        <CardAction>
          <Button disabled={loading} onClick={compile}>
            {loading ? <Spinner /> : <Play />}
            {loading ? "Compiling…" : script.error ? "Re-compile" : "Compile"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="h-32 overflow-y-auto">
        <pre
          className={cn("font-mono text-xs", {
            "text-destructive": !!script.error,
          })}
        >
          {content}
        </pre>
      </CardContent>
    </Card>
  );
};

export default EditorConsole;
