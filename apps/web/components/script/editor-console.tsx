import { Button } from "@workspace/ui/components/button";
import { Kbd } from "@workspace/ui/components/kbd";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
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
  ScrollText,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import CopyButton from "@/components/lib/copy-button";
import SimulatePanel from "@/components/script/simulate/simulate-panel";
import { shortcutLabel } from "@/hooks/use-script-shortcuts";
import {
  type ConsoleEntry,
  type ConsoleLevel,
  consoleLogText,
  countsSuffix,
  displayedOutput,
  formatConsoleTime,
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

type ConsoleView = "output" | "simulate";

export type EditorLocation = { line: number; column: number };

// Collapsed: only the header bar shows. Maximized: the editor is hidden.
export type ConsoleState = "collapsed" | "normal" | "maximized";

// The console panel's height when collapsed, in px: its header bar (`h-10`)
// and the panel's top and bottom borders.
export const CONSOLE_HEADER_HEIGHT = 42;

const levelClassNames: Record<ConsoleLevel, string> = {
  info: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
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

// Its accessible name is the label alone: the shortcut shows in the tooltip.
const IconButton = ({
  label,
  shortcut,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <Tooltip>
    <TooltipTrigger
      delay={100}
      render={
        <Button
          variant="ghost"
          size="icon-sm"
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
      {shortcut && <Kbd>{shortcutLabel(shortcut)}</Kbd>}
    </TooltipContent>
  </Tooltip>
);

// The header bar's status: the latest entry, as one text node (`[10:25:25]
// Compiled counter-account in 3.9 s.`), or the empty log's placeholder.
// Keep it one text node and not a button: the e2e specs' anchored regexes
// (`/^Compiled …/`) and `getByRole("button", { name: "Compile" })` (a
// case-insensitive substring) would match it too, and fail on two elements.
const Status = ({ entry }: { entry?: ConsoleEntry }) => (
  <p
    className={cn(
      "mr-auto ml-2 min-w-0 truncate font-mono text-xs",
      entry ? levelClassNames[entry.level] : "text-muted-foreground",
    )}
    title={
      entry
        ? `[${formatConsoleTime(entry.timestamp)}] ${entry.text}`
        : undefined
    }
  >
    {entry
      ? `[${formatConsoleTime(entry.timestamp)}] ${entry.text}`
      : "Compile the script to see its output here."}
  </p>
);

const EditorConsole = ({
  script,
  compiling,
  state,
  onStateChange,
  onRevealLocation,
}: {
  script: Script;
  // A compile started from the page: the log follows its output.
  compiling: boolean;
  state: ConsoleState;
  onStateChange: (state: ConsoleState) => void;
  onRevealLocation: (location: EditorLocation) => void;
}) => {
  const { entries, append, clear } = useConsoleLog(script.id);
  const [fullOutput, setFullOutput] = useFullOutput();
  // The log, or the Simulate tab. Not in the URL: `?tab=` is the page's.
  const [view, setView] = useState<ConsoleView>("output");
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
  // A new compile shows the log and scrolls down to its output, even if
  // scrolled up. Declared
  // before the effect below, which runs after it in the same commit.
  useLayoutEffect(() => {
    if (compiling) {
      stickToBottom.current = true;
      setView("output");
    }
  }, [compiling]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: on new entries.
  useLayoutEffect(() => {
    const scroll = scrollRef.current;
    if (scroll && stickToBottom.current) {
      scroll.scrollTop = scroll.scrollHeight;
    }
  }, [entries.length]);
  // The latest compile result: only its locations link to the editor.
  const latestCompileId = entries.findLast(({ compile }) => compile)?.id;
  return (
    <Tabs
      value={view}
      onValueChange={(value: ConsoleView) => {
        setView(value);
        // A collapsed console shows its header bar only.
        if (state === "collapsed") {
          onStateChange("normal");
        }
      }}
      className="h-full gap-0 overflow-hidden border bg-card text-card-foreground"
      render={<section aria-label="Editor Console" />}
    >
      <div className="flex h-10 shrink-0 items-center gap-1 px-1">
        <TabsList variant="line" className="shrink-0">
          <TabsTrigger value="output">Output</TabsTrigger>
          <TabsTrigger value="simulate">Simulate</TabsTrigger>
        </TabsList>
        <Status entry={entries.at(-1)} />
        {state === "collapsed" ? (
          <IconButton
            label="Restore console"
            shortcut="J"
            onClick={() => onStateChange("normal")}
          >
            <PanelBottomOpen />
          </IconButton>
        ) : (
          <IconButton
            label="Minimize console"
            shortcut="J"
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
        {/* The log's own tools. */}
        {view === "output" && (
          <>
            {/* Not on the narrowest phones (under 360 px), where the tabs
                leave no room for them. */}
            <span className="contents max-[359px]:hidden">
              <Tooltip>
                <TooltipTrigger
                  delay={100}
                  render={
                    <Toggle
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
                variant="ghost"
              />
            </span>
            <IconButton
              label="Clear console"
              shortcut="L"
              disabled={entries.length === 0}
              onClick={clear}
            >
              <Trash2 />
            </IconButton>
          </>
        )}
      </div>
      {/* Both stay mounted: the log keeps its scroll position, the Simulate
          tab its arguments and results. */}
      <TabsContent
        value="output"
        keepMounted
        ref={scrollRef}
        className="min-h-0 overflow-y-auto border-t px-3 py-2"
        onScroll={({ currentTarget }) => {
          stickToBottom.current =
            currentTarget.scrollHeight -
              currentTarget.scrollTop -
              currentTarget.clientHeight <
            STICK_TO_BOTTOM_PX;
        }}
      >
        {/* Empty until the first compile: the header bar says so. */}
        <pre
          className="flex flex-col gap-2 font-mono text-xs"
          aria-live="polite"
        >
          {entries.map((entry) => (
            <Entry
              key={entry.id}
              entry={entry}
              latest={entry.id === latestCompileId}
              fullOutput={fullOutput}
              onRevealLocation={onRevealLocation}
            />
          ))}
        </pre>
      </TabsContent>
      <TabsContent
        value="simulate"
        keepMounted
        className="min-h-0 overflow-y-auto border-t px-3 py-2"
      >
        <SimulatePanel script={script} onFailure={() => setView("output")} />
      </TabsContent>
    </Tabs>
  );
};

export default EditorConsole;
