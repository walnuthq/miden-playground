import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { Play, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import CopyButton from "@/components/lib/copy-button";
import useScripts from "@/hooks/use-scripts";
import {
  type ConsoleEntry,
  type ConsoleLevel,
  consoleLogText,
  formatConsoleTime,
  formatDuration,
  hasConsoleLog,
  useConsoleLog,
} from "@/lib/console-log";
import type { Script } from "@/lib/types/script";
import {
  countDiagnostics,
  outputLineSeverity,
  splitLocations,
} from "@/lib/utils/diagnostics";

export type EditorLocation = { line: number; column: number };

const levelClassNames: Record<ConsoleLevel, string> = {
  info: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
};

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

// `(1 error, 2 warnings)`, or nothing when the output reports none.
const countsSuffix = ({
  errors,
  warnings,
}: {
  errors: number;
  warnings: number;
}) => {
  const counts = [
    errors > 0 && plural(errors, "error"),
    warnings > 0 && plural(warnings, "warning"),
  ].filter(Boolean);
  return counts.length > 0 ? ` (${counts.join(", ")})` : "";
};

// Within this distance of the bottom, new entries keep the log scrolled down.
const STICK_TO_BOTTOM_PX = 16;

const Output = ({
  output,
  onRevealLocation,
}: {
  output: string;
  // Undefined on older compiles: their locations predate the latest compile,
  // which the editor follows edits from.
  onRevealLocation?: (location: EditorLocation) => void;
}) =>
  output
    .trimEnd()
    .split("\n")
    .map((line, lineIndex) => {
      const severity = outputLineSeverity(line);
      return (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static lines.
          key={lineIndex}
          className={cn("min-h-[1lh]", severity && levelClassNames[severity])}
        >
          {splitLocations(line).map((part, index) =>
            "line" in part && onRevealLocation ? (
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
        </div>
      );
    });

const Entry = ({
  entry: { timestamp, level, text, output },
  latest,
  onRevealLocation,
}: {
  entry: ConsoleEntry;
  latest: boolean;
  onRevealLocation: (location: EditorLocation) => void;
}) => (
  <div className={cn({ "opacity-70": !latest && output })}>
    <div>
      <span className="text-muted-foreground">
        [{formatConsoleTime(timestamp)}]
      </span>{" "}
      <span className={levelClassNames[level]}>{text}</span>
    </div>
    {output && (
      <Output
        output={output}
        onRevealLocation={latest ? onRevealLocation : undefined}
      />
    )}
  </div>
);

const EditorConsole = ({
  script,
  onRevealLocation,
}: {
  script: Script;
  onRevealLocation: (location: EditorLocation) => void;
}) => {
  const { compileScript } = useScripts();
  const { entries, append, clear } = useConsoleLog(script.id);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  // Starts with the last compile's error, if any, the first time the script
  // shows. The API doesn't store it: a script fetched from there has none.
  // biome-ignore lint/correctness/useExhaustiveDependencies: on mount only.
  useEffect(() => {
    if (
      !hasConsoleLog(script.id) &&
      script.status === "error" &&
      script.error
    ) {
      append({
        level: "error",
        text: `Last compile failed${countsSuffix(countDiagnostics(script.error))}.`,
        output: script.error,
        compile: true,
      });
    }
  }, []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: on new entries.
  useLayoutEffect(() => {
    const scroll = scrollRef.current;
    if (scroll && stickToBottom.current) {
      scroll.scrollTop = scroll.scrollHeight;
    }
  }, [entries.length]);
  // The latest compile result: only its locations link to the editor.
  const latestCompileId = entries.findLast(({ compile }) => compile)?.id;
  const compile = async () => {
    setLoading(true);
    stickToBottom.current = true;
    append({ level: "info", text: `Compiling ${script.name}…` });
    const start = performance.now();
    const { script: compiledScript, error } = await compileScript(script);
    const duration = formatDuration(performance.now() - start);
    setLoading(false);
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
      // Without located warnings it's only build noise.
      output: counts.warnings > 0 ? warnings : undefined,
      compile: true,
    });
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor Console</CardTitle>
        <CardAction className="flex gap-2">
          <CopyButton
            content="Copy output"
            copy={consoleLogText(entries)}
            disabled={entries.length === 0}
          />
          <Tooltip>
            <TooltipTrigger
              delay={100}
              render={
                <Button
                  variant="secondary"
                  className="size-8"
                  aria-label="Clear console"
                  disabled={entries.length === 0}
                  onClick={clear}
                />
              }
            >
              <Trash2 />
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear console</p>
            </TooltipContent>
          </Tooltip>
          <Button disabled={loading} onClick={compile}>
            {loading ? <Spinner /> : <Play />}
            {loading ? "Compiling…" : script.error ? "Re-compile" : "Compile"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent
        ref={scrollRef}
        className="h-48 overflow-y-auto"
        onScroll={({ currentTarget }) => {
          stickToBottom.current =
            currentTarget.scrollHeight -
              currentTarget.scrollTop -
              currentTarget.clientHeight <
            STICK_TO_BOTTOM_PX;
        }}
      >
        <pre
          className="flex flex-col gap-2 font-mono text-xs"
          aria-live="polite"
        >
          {entries.length === 0 ? (
            <span className="text-muted-foreground">
              Compile the script to see its output here.
            </span>
          ) : (
            entries.map((entry) => (
              <Entry
                key={entry.id}
                entry={entry}
                latest={entry.id === latestCompileId}
                onRevealLocation={onRevealLocation}
              />
            ))
          )}
        </pre>
      </CardContent>
    </Card>
  );
};

export default EditorConsole;
