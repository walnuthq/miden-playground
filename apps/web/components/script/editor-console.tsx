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
import { defaultExport, type Script } from "@/lib/types/script";
import useScripts from "@/hooks/use-scripts";
import { cn } from "@workspace/ui/lib/utils";
import { compileScript } from "@/lib/api";

const EditorConsole = ({ script }: { script: Script }) => {
  const { scripts, updateScript } = useScripts();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const compile = async () => {
    setLoading(true);
    const { error, masm, digest, masp, exports, dependencies } =
      await compileScript(script);
    updateScript(script.id, {
      error,
      masm,
      status: error ? "error" : "compiled",
      digest,
      masp,
      exports: error
        ? script.exports
        : exports.map((procedureExport) => ({
            ...defaultExport(),
            ...procedureExport,
            readOnly: procedureExport.name.startsWith("get"),
          })),
      dependencies: error
        ? script.dependencies
        : dependencies
            .map((dependency) => {
              const scriptDependency = scripts.find(
                ({ digest }) => digest === dependency.digest
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
