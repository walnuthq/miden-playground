import { useState } from "react";
import { Play, RotateCw } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { type Script } from "@/lib/types/script";
import useScripts from "@/hooks/use-scripts";
import { cn } from "@workspace/ui/lib/utils";
import { compileScript } from "@/lib/api";

const EditorConsole = ({ script }: { script: Script }) => {
  const { updateScript } = useScripts();
  const [loading, setLoading] = useState(false);
  const compile = async () => {
    setLoading(true);
    const { error, masm } = await compileScript(script);
    updateScript({
      ...script,
      error,
      masm,
      status: masm ? "compiled" : "draft",
    });
    setLoading(false);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor Console</CardTitle>
        <CardAction>
          <Button disabled={loading} onClick={compile}>
            {loading ? <RotateCw className="animate-spin" /> : <Play />}

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
              : ""}
        </pre>
      </CardContent>
    </Card>
  );
};

export default EditorConsole;
