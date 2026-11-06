import { useState } from "react";
import { toast } from "sonner";
import useScripts from "@/hooks/use-scripts";
import { countsSuffix, formatDuration, useConsoleLog } from "@/lib/console-log";
import type { Script } from "@/lib/types/script";
import { countDiagnostics } from "@/lib/utils/diagnostics";

// Compiles a script and logs it in its editor console. Used by the Compile
// button of the script page, above the editor and the console. The page calls
// it before it knows the script exists: `compile` does nothing without one.
const useCompileScript = (script?: Script) => {
  const { compileScript } = useScripts();
  const { append } = useConsoleLog(script?.id ?? "");
  const [compiling, setCompiling] = useState(false);
  const compile = async () => {
    if (!script) {
      return;
    }
    setCompiling(true);
    append({ level: "info", text: `Compiling ${script.name}…` });
    const start = performance.now();
    const { script: compiledScript, error } = await compileScript(script).catch(
      (error: unknown) => ({
        script: undefined,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    const duration = formatDuration(performance.now() - start);
    setCompiling(false);
    if (!compiledScript) {
      append({
        level: "error",
        text: `Compile request failed after ${duration}: ${error || "unknown error"}`,
      });
      toast.error("Script compilation failed.", { description: error });
      return;
    }
    if (compiledScript.error) {
      append({
        level: "error",
        text: `Compilation failed in ${duration}${countsSuffix(countDiagnostics(compiledScript.error))}.`,
        output: compiledScript.error,
        compile: true,
      });
      return;
    }
    const warnings = compiledScript.warnings ?? "";
    const counts = countDiagnostics(warnings);
    append({
      level: counts.warnings > 0 ? "warning" : "success",
      text: `Compiled ${script.name} in ${duration}${countsSuffix(counts)}.`,
      // Without located warnings, the clean output is empty.
      output: warnings || undefined,
      compile: true,
    });
  };
  return { compile, compiling };
};

export default useCompileScript;
