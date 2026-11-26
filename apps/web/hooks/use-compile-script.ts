import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useGlobalContext from "@/components/global-context/hook";
import useScripts from "@/hooks/use-scripts";
import { trackEvent } from "@/lib/analytics";
import type { AnalyticsOutcome } from "@/lib/analytics-events";
import { countsSuffix, formatDuration, useConsoleLog } from "@/lib/console-log";
import type { Script } from "@/lib/types/script";
import { countDiagnostics } from "@/lib/utils/diagnostics";
import { scriptSource } from "@/lib/utils/script-files";

// Compiles a script and logs it in its editor console. Used by the Compile
// button of the script page, above the editor and the console. The page calls
// it before it knows the script exists: `compile` does nothing without one.
const useCompileScript = (script?: Script) => {
  const { compileScript } = useScripts();
  const { tutorialId } = useGlobalContext();
  const { append } = useConsoleLog(script?.id ?? "");
  const [compiling, setCompiling] = useState(false);
  // The script as last rendered, to tell whether it changed during a compile.
  const latest = useRef(script);
  useEffect(() => {
    latest.current = script;
  });
  const compile = async () => {
    if (!script) {
      return;
    }
    const track = (outcome: AnalyticsOutcome) =>
      trackEvent("compile_script", {
        script_type: script.type,
        outcome,
        tutorial_id: tutorialId,
      });
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
      track("failed");
      return;
    }
    const current = latest.current;
    if (current && scriptSource(current) !== scriptSource(script)) {
      append({
        level: "info",
        text: `${script.name} changed while it compiled: compile again to update its package.`,
      });
      return;
    }
    if (compiledScript.error) {
      append({
        level: "error",
        text: `Compilation failed in ${duration}${countsSuffix(countDiagnostics(compiledScript.diagnostics))}.`,
        output: compiledScript.error,
        compile: true,
      });
      track("error");
      return;
    }
    const warnings = compiledScript.warnings ?? "";
    const counts = countDiagnostics(compiledScript.diagnostics);
    append({
      level: counts.warnings > 0 ? "warning" : "success",
      text: `Compiled ${script.name} in ${duration}${countsSuffix(counts)}.`,
      // A build without warnings has an empty `stderr`.
      output: warnings || undefined,
      compile: true,
    });
    track("ok");
  };
  return { compile, compiling };
};

export default useCompileScript;
