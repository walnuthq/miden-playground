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
  const { updateScript } = useScripts();
  const [loading, setLoading] = useState(false);
  const compile = async () => {
    setLoading(true);
    const { error, masm, root, packageBytes, exports, dependencies } =
      await compileScript(script);
    updateScript({
      ...script,
      error,
      masm,
      status: masm
        ? "compiled"
        : packageBytes.length > 0
          ? "compiled"
          : "draft",
      root,
      packageBytes,
      exports: exports.map((procedureExport) => ({
        ...defaultExport(),
        ...procedureExport,
        readOnly: procedureExport.name.startsWith("get"),
        storageRead:
          procedureExport.name.startsWith("get") &&
          script.rust.includes("StorageMap")
            ? { type: "map", index: 0, key: ["0", "0", "0", "1"] }
            : { type: "value", index: 0 },
      })),
      dependencies,
    });
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
          {script.error
            ? script.error
            : script.masm
              ? "Script compiled to MASM."
              : script.packageBytes.length > 0
                ? "Script compiled successfully."
                : ""}
        </pre>
      </CardContent>
    </Card>
  );
};

export default EditorConsole;
