import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Spinner } from "@workspace/ui/components/spinner";
import { cn } from "@workspace/ui/lib/utils";
import { Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useScripts from "@/hooks/use-scripts";
import type { Script } from "@/lib/types/script";
import { splitLocations } from "@/lib/utils/diagnostics";

export type EditorLocation = { line: number; column: number };

const EditorConsole = ({
  script,
  onRevealLocation,
}: {
  script: Script;
  onRevealLocation: (location: EditorLocation) => void;
}) => {
  const { compileScript } = useScripts();
  const [loading, setLoading] = useState(false);
  // Starts with the last compile's error, if any. The API doesn't store it: a
  // script fetched from there has none.
  const [content, setContent] = useState(script.error ?? "");
  const compile = async () => {
    setLoading(true);
    const { script: compiledScript, error } = await compileScript(script);
    setLoading(false);
    if (compiledScript) {
      setContent(
        compiledScript.error
          ? compiledScript.error
          : "Script compiled successfully.",
      );
    } else {
      toast.error("Script compilation failed.", { description: error });
    }
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
          {splitLocations(content).map((part, index) =>
            "line" in part ? (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: static parts.
                key={index}
                type="button"
                className="cursor-pointer underline underline-offset-2 hover:text-foreground"
                onClick={() => onRevealLocation(part)}
              >
                {part.text}
              </button>
            ) : (
              part.text
            ),
          )}
        </pre>
      </CardContent>
    </Card>
  );
};

export default EditorConsole;
