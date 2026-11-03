import { Button } from "@workspace/ui/components/button";
import { Kbd } from "@workspace/ui/components/kbd";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type PanelImperativeHandle,
  useDefaultLayout,
} from "react-resizable-panels";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import Editor, {
  type CodeEditor,
  currentPosition,
} from "@/components/lib/editor";
import NotFound from "@/components/lib/not-found";
import AddDependencyDialog from "@/components/script/add-dependency-dialog";
import EditorConsole, {
  CONSOLE_HEADER_HEIGHT,
  type ConsoleState,
  type EditorLocation,
} from "@/components/script/editor-console";
import ScriptMetadata from "@/components/script/script-metadata";
import useCompileScript from "@/hooks/use-compile-script";
import useScriptShortcuts, {
  shortcutLabel,
} from "@/hooks/use-script-shortcuts";
import { clearConsoleLog } from "@/lib/console-log";
import type { Script } from "@/lib/types/script";

// Puts the cursor on a location of the last compile's output. The code may have
// changed since the compile: follow the location.
const reveal = (editor: CodeEditor, location: EditorLocation) => {
  const position = currentPosition(editor, location);
  editor.setPosition(position);
  editor.revealPositionInCenter(position);
  editor.focus();
};

// The script page fills the viewport below the header (`h-16`, `h-12` with the
// icon sidebar), so the editor and the console scroll, not the page.
const PAGE_HEIGHT_CLASS_NAME =
  "h-[calc(100svh-4rem)] group-has-data-[collapsible=icon]/sidebar-wrapper:h-[calc(100svh-3rem)]";

const ScriptComponent = ({ id, script }: { id: string; script?: Script }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  // The Rust editor, for the console's links to its locations.
  const editorRef = useRef<CodeEditor | null>(null);
  // A link clicked on another tab, revealed once the Rust tab shows.
  const pendingReveal = useRef<EditorLocation | null>(null);
  // The editor/console split. The console is collapsed to its header bar, or
  // maximized by collapsing the editor.
  const editorPanelRef = useRef<PanelImperativeHandle | null>(null);
  const consolePanelRef = useRef<PanelImperativeHandle | null>(null);
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  // Only drags are saved: a reload never opens with the editor hidden.
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "script-editor-layout",
    panelIds: ["editor", "console"],
    storage: localStorage,
    onlySaveAfterUserInteractions: true,
  });
  const { compile, compiling } = useCompileScript(script);
  const defaultTab = script?.rust !== "" ? "rust" : "masm";
  const tab = searchParams.get("tab") ?? defaultTab;
  const consoleState: ConsoleState = consoleCollapsed
    ? "collapsed"
    : editorCollapsed
      ? "maximized"
      : "normal";
  const setConsoleState = (state: ConsoleState) => {
    if (state === "collapsed") {
      editorPanelRef.current?.expand();
      consolePanelRef.current?.collapse();
    } else if (state === "maximized") {
      consolePanelRef.current?.expand();
      editorPanelRef.current?.collapse();
    } else {
      consolePanelRef.current?.expand();
      editorPanelRef.current?.expand();
    }
  };
  // The Compile button and Cmd/Ctrl+S: a collapsed console opens itself to
  // show the output.
  const compileAndShow = () => {
    if (compiling) {
      return;
    }
    consolePanelRef.current?.expand();
    compile();
  };
  useScriptShortcuts({
    enabled: script !== undefined && !script.readOnly,
    onCompile: compileAndShow,
    // A maximized console hides, like VS Code's panel.
    onToggleConsole: () =>
      setConsoleState(consoleState === "collapsed" ? "normal" : "collapsed"),
    onClearConsole: () => clearConsoleLog(id),
  });
  useEffect(() => {
    const editor = editorRef.current;
    const location = pendingReveal.current;
    if (tab !== "rust" || !editor || !location) {
      return;
    }
    pendingReveal.current = null;
    // Measure it now it's visible, or the reveal centers in a zero-size view.
    editor.layout();
    reveal(editor, location);
  }, [tab]);
  if (!script) {
    return <NotFound />;
  }
  // The console shows on every tab, but its locations are in the Rust code:
  // switch to it first. The editor stays mounted on the other tabs.
  const revealLocation = (location: EditorLocation) => {
    // Maximized console: show the editor again.
    editorPanelRef.current?.expand();
    const editor = editorRef.current;
    if (tab === "rust" && editor) {
      reveal(editor, location);
    } else {
      pendingReveal.current = location;
      navigate(pathname);
    }
  };
  const tabs = (
    <>
      {/* Kept mounted across tabs: its undo history, scroll position and
          compile markers survive a look at the metadata. */}
      <TabsContent value="rust" keepMounted className="h-full">
        <Editor
          script={script}
          language="rust"
          readOnly={script.readOnly}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
        />
      </TabsContent>
      {script.masm && (
        <TabsContent value="masm" className="h-full">
          <Editor script={script} language="masm" readOnly />
        </TabsContent>
      )}
      <TabsContent value="metadata" className="h-full overflow-y-auto">
        <ScriptMetadata script={script} />
      </TabsContent>
    </>
  );
  return (
    <div className={cn("flex flex-col gap-4 px-4", PAGE_HEIGHT_CLASS_NAME)}>
      <Tabs
        className="min-h-0 flex-1"
        value={tab}
        onValueChange={(value) =>
          navigate(
            value === "rust"
              ? pathname
              : `${pathname}?${new URLSearchParams({ tab: value })}`,
          )
        }
      >
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="rust">Rust</TabsTrigger>
            {script.masm && <TabsTrigger value="masm">MASM</TabsTrigger>}
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>
          {!script.readOnly && (
            <Tooltip>
              <TooltipTrigger
                delay={300}
                render={
                  <Button disabled={compiling} onClick={compileAndShow} />
                }
              >
                {compiling ? <Spinner /> : <Play />}
                {compiling
                  ? "Compiling…"
                  : script.error
                    ? "Re-compile"
                    : "Compile"}
              </TooltipTrigger>
              <TooltipContent>
                Compile <Kbd>{shortcutLabel("S")}</Kbd>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {script.readOnly ? (
          <div className="min-h-0 flex-1">{tabs}</div>
        ) : (
          <ResizablePanelGroup
            orientation="vertical"
            className="min-h-0 flex-1"
            defaultLayout={defaultLayout}
            onLayoutChanged={onLayoutChanged}
          >
            <ResizablePanel
              id="editor"
              panelRef={editorPanelRef}
              collapsible
              collapsedSize={0}
              minSize="20%"
              defaultSize="65%"
              onResize={() =>
                setEditorCollapsed(
                  editorPanelRef.current?.isCollapsed() ?? false,
                )
              }
            >
              {tabs}
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-transparent" />
            <ResizablePanel
              id="console"
              panelRef={consolePanelRef}
              collapsible
              collapsedSize={CONSOLE_HEADER_HEIGHT}
              minSize={CONSOLE_HEADER_HEIGHT + 96}
              defaultSize="35%"
              onResize={() =>
                setConsoleCollapsed(
                  consolePanelRef.current?.isCollapsed() ?? false,
                )
              }
            >
              <EditorConsole
                script={script}
                compiling={compiling}
                state={consoleState}
                onStateChange={setConsoleState}
                onRevealLocation={revealLocation}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </Tabs>
      <AddDependencyDialog />
    </div>
  );
};

export default ScriptComponent;
