import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import { Toggle } from "@workspace/ui/components/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import {
  Maximize2,
  Minimize2,
  PanelBottomClose,
  PanelBottomOpen,
  Play,
  ScrollText,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import CopyButton from "@/components/lib/copy-button";
import useScripts from "@/hooks/use-scripts";
import {
  type ConsoleEntry,
  type ConsoleLevel,
  consoleLogText,
  displayedOutput,
  formatConsoleTime,
  formatDuration,
  hasConsoleLog,
  useConsoleLog,
  useFullOutput,
} from "@/lib/console-log";
import type { Script } from "@/lib/types/script";
import {
  countDiagnostics,
  outputLineSeverity,
  splitLocations,
} from "@/lib/utils/diagnostics";

export type EditorLocation = { line: number; column: number };

// Collapsed: only the header bar shows. Maximized: the editor is hidden.
export type ConsoleState = "collapsed" | "normal" | "maximized";

// The console panel's height when collapsed, in px: its header bar (`h-12`)
// and the panel's top and bottom borders.
export const CONSOLE_HEADER_HEIGHT = 50;

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

const LINK_CLASS_NAME = "underline underline-offset-2 hover:text-foreground";

const Output = ({
  output,
  onRevealLocation,
}: {
  output: string;
  // Undefined on older compiles: their locations predate the latest compile,
  // which the editor follows edits from.
  onRevealLocation?: (location: EditorLocation) => void;
}) =>
  output.split("\n").map((line, lineIndex) => {
    const severity = outputLineSeverity(line);
    return (
      <div
        // biome-ignore lint/suspicious/noArrayIndexKey: static lines.
        key={lineIndex}
        className={cn("min-h-[1lh]", severity && levelClassNames[severity])}
      >
        {splitLocations(line).map((part, index) =>
          "href" in part ? (
            <a
              // biome-ignore lint/suspicious/noArrayIndexKey: static parts.
              key={index}
              href={part.href}
              target="_blank"
              rel="noreferrer"
              className={LINK_CLASS_NAME}
            >
              {part.text}
            </a>
          ) : "line" in part && onRevealLocation ? (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: static parts.
              key={index}
              type="button"
              className={cn("cursor-pointer", LINK_CLASS_NAME)}
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
  entry: { timestamp, level, text, output: rawOutput },
  latest,
  fullOutput,
  onRevealLocation,
}: {
  entry: ConsoleEntry;
  latest: boolean;
  fullOutput: boolean;
  onRevealLocation: (location: EditorLocation) => void;
}) => {
  const output = displayedOutput(rawOutput, fullOutput);
  return (
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
};

const IconButton = ({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <Tooltip>
    <TooltipTrigger
      delay={100}
      render={
        <Button
          variant="secondary"
          className="size-8"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        />
      }
    >
      {children}
    </TooltipTrigger>
    <TooltipContent>
      <p>{label}</p>
    </TooltipContent>
  </Tooltip>
);

const EditorConsole = ({
  script,
  state,
  onStateChange,
  onRevealLocation,
}: {
  script: Script;
  state: ConsoleState;
  onStateChange: (state: ConsoleState) => void;
  onRevealLocation: (location: EditorLocation) => void;
}) => {
  const { compileScript } = useScripts();
  const { entries, append, clear } = useConsoleLog(script.id);
  const [fullOutput, setFullOutput] = useFullOutput();
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
    // A collapsed console opens itself to show the output.
    if (state === "collapsed") {
      onStateChange("normal");
    }
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
      // Without located warnings, the clean output is empty.
      output: warnings || undefined,
      compile: true,
    });
  };
  return (
    <section
      aria-label="Editor Console"
      className="flex h-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground"
    >
      <div className="flex h-12 shrink-0 items-center gap-2 px-3">
        <button
          type="button"
          className="mr-auto cursor-pointer truncate text-sm font-medium"
          onClick={() =>
            onStateChange(state === "collapsed" ? "normal" : "collapsed")
          }
        >
          Editor Console
        </button>
        {state === "collapsed" ? (
          <IconButton
            label="Restore console"
            onClick={() => onStateChange("normal")}
          >
            <PanelBottomOpen />
          </IconButton>
        ) : (
          <IconButton
            label="Minimize console"
            onClick={() => onStateChange("collapsed")}
          >
            <PanelBottomClose />
          </IconButton>
        )}
        {state === "maximized" ? (
          <IconButton
            label="Restore editor"
            onClick={() => onStateChange("normal")}
          >
            <Minimize2 />
          </IconButton>
        ) : (
          <IconButton
            label="Maximize console"
            onClick={() => onStateChange("maximized")}
          >
            <Maximize2 />
          </IconButton>
        )}
        <Tooltip>
          <TooltipTrigger
            delay={100}
            render={
              <Toggle
                variant="outline"
                size="sm"
                aria-label="Show full output"
                pressed={fullOutput}
                onPressedChange={setFullOutput}
              />
            }
          >
            <ScrollText />
          </TooltipTrigger>
          <TooltipContent>
            <p>{fullOutput ? "Show clean output" : "Show full output"}</p>
          </TooltipContent>
        </Tooltip>
        <CopyButton
          content="Copy output"
          copy={consoleLogText(entries, fullOutput)}
          disabled={entries.length === 0}
        />
        <IconButton
          label="Clear console"
          disabled={entries.length === 0}
          onClick={clear}
        >
          <Trash2 />
        </IconButton>
        <Button disabled={loading} onClick={compile}>
          {loading ? <Spinner /> : <Play />}
          {loading ? "Compiling…" : script.error ? "Re-compile" : "Compile"}
        </Button>
      </div>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto border-t px-3 py-2"
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
                fullOutput={fullOutput}
                onRevealLocation={onRevealLocation}
              />
            ))
          )}
        </pre>
      </div>
    </section>
  );
};

export default EditorConsole;
