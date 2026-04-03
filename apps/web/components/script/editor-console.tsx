import { useState } from "react";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@workspace/ui/components/spinner";
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

const EditorConsole = ({ script }: { script: Script }) => {
  const { compileScript } = useScripts();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
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
          {content}
        </pre>
      </CardContent>
    </Card>
  );
};

export default EditorConsole;
