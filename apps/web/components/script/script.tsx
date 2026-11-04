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
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
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
import EditorSettingsMenu from "@/components/script/editor-settings-menu";
import ScriptExplorer from "@/components/script/script-explorer";
import ScriptManifest from "@/components/script/script-manifest";
import useCompileScript from "@/hooks/use-compile-script";
import useScriptShortcuts, {
  shortcutLabel,
} from "@/hooks/use-script-shortcuts";
import useTutorials from "@/hooks/use-tutorials";
import { clearConsoleLog } from "@/lib/console-log";
import type { Script, ScriptFilePath } from "@/lib/types/script";
import { assembledFromMasm } from "@/lib/utils/script";
import { SCRIPT_FILE, scriptSource } from "@/lib/utils/script-files";

// Puts the cursor on a location of the last compile's output. The code may have
// changed since the compile: follow the location.
const reveal = (editor: CodeEditor, location: EditorLocation) => {
  const position = currentPosition(editor, location);
  editor.setPosition(position);
  editor.revealPositionInCenter(position);
  editor.focus();
};

const NO_MASM = "Compile the script to see its Miden Assembly.";
const NO_RUST =
  "This script is written in Miden Assembly: it has no Rust source.";

// The script page fills the viewport below the header (`h-16`, `h-12` with the
// icon sidebar), so the editor and the console scroll, not the page.
const PAGE_HEIGHT_CLASS_NAME =
  "h-[calc(100svh-4rem)] group-has-data-[collapsible=icon]/sidebar-wrapper:h-[calc(100svh-3rem)]";
// On a phone, a tutorial's closed panel (`h-12`) sits below the page too.
const MOBILE_TUTORIAL_PAGE_HEIGHT_CLASS_NAME = "h-[calc(100svh-7rem)]";

const ScriptComponent = ({ id, script }: { id: string; script?: Script }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  // The source's editor, for the console's links to its locations.
  const editorRef = useRef<CodeEditor | null>(null);
  // A link clicked while the source is hidden (another tab or file), revealed
  // once it shows.
  const pendingReveal = useRef<EditorLocation | null>(null);
  // The Explorer's open files, the source only at first.
  const [openPaths, setOpenPaths] = useState<ScriptFilePath[]>([SCRIPT_FILE]);
  const [activePath, setActivePath] = useState<ScriptFilePath | null>(
    SCRIPT_FILE,
  );
  const openFile = (path: ScriptFilePath) => {
    setOpenPaths((paths) => (paths.includes(path) ? paths : [...paths, path]));
    setActivePath(path);
  };
  // Closing the active tab activates the one that takes its place, or the new
  // last one.
  const closeFile = (path: ScriptFilePath) => {
    const index = openPaths.indexOf(path);
    const remaining = openPaths.filter((openPath) => openPath !== path);
    setOpenPaths(remaining);
    if (path === activePath) {
      setActivePath(remaining[Math.min(index, remaining.length - 1)] ?? null);
    }
  };
  // The editor/console split. The console is collapsed to its header bar, or
  // maximized by collapsing the editor.
  const editorPanelRef = useRef<PanelImperativeHandle | null>(null);
  const consolePanelRef = useRef<PanelImperativeHandle | null>(null);
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  // A phone has no height to spare: its console starts collapsed to its
  // header bar (compiling opens it), and its split is saved apart.
  const isMobile = useIsMobile();
  const { tutorialId } = useTutorials();
  // Only drags are saved: a reload never opens with the editor hidden.
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: isMobile ? "script-editor-layout-mobile" : "script-editor-layout",
    panelIds: ["editor", "console"],
    storage: localStorage,
    onlySaveAfterUserInteractions: true,
  });
  const { compile, compiling } = useCompileScript(script);
  // The MASM-only built-ins have no Rust source, so no files for the Explorer.
  // Not just an empty source: an editable script's can be cleared, and the
  // mock API's scripts are assembled from MASM but have Rust.
  const masmOnly =
    !!script && assembledFromMasm(script) && scriptSource(script) === "";
  const defaultTab = masmOnly ? "masm" : "explorer";
  // The tabs were called `rust` and `metadata` before the Explorer.
  const tabParam = searchParams.get("tab");
  const requestedTab =
    tabParam === "rust"
      ? "explorer"
      : tabParam === "metadata"
        ? "manifest"
        : (tabParam ?? defaultTab);
  // A `?tab=explorer` link to a MASM-only script shows its MASM.
  const tab = masmOnly && requestedTab === "explorer" ? "masm" : requestedTab;
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
    // A maximized console hides, like VS Code's panel. Asks the panel, not
    // `consoleState`: that one waits for the re-render after `onResize`, so a
    // second press before it would collapse the console again.
    onToggleConsole: () =>
      setConsoleState(
        consolePanelRef.current?.isCollapsed() ? "normal" : "collapsed",
      ),
    onClearConsole: () => clearConsoleLog(id),
  });
  useEffect(() => {
    const editor = editorRef.current;
    const location = pendingReveal.current;
    if (
      tab !== "explorer" ||
      activePath !== SCRIPT_FILE ||
      !editor ||
      !location
    ) {
      return;
    }
    pendingReveal.current = null;
    // Measure it now it's visible, or the reveal centers in a zero-size view.
    editor.layout();
    reveal(editor, location);
  }, [tab, activePath]);
  if (!script) {
    return <NotFound />;
  }
  // The console shows on every tab, but its locations are in the source:
  // show it first, in the Explorer, opening its tab again if it was closed.
  // Its editor stays mounted meanwhile.
  const revealLocation = (location: EditorLocation) => {
    // Maximized console: show the editor again.
    editorPanelRef.current?.expand();
    const editor = editorRef.current;
    if (tab === "explorer" && activePath === SCRIPT_FILE && editor) {
      reveal(editor, location);
      return;
    }
    pendingReveal.current = location;
    openFile(SCRIPT_FILE);
    if (tab !== "explorer") {
      navigate(pathname);
    }
  };
  const tabs = (
    <>
      {/* Kept mounted across tabs: the source's undo history, scroll
          position and compile markers survive a look at the manifest. */}
      <TabsContent value="explorer" keepMounted className="h-full">
        <ScriptExplorer
          script={script}
          openPaths={openPaths}
          activePath={activePath}
          onOpen={openFile}
          onClose={closeFile}
          onMountSource={(editor) => {
            editorRef.current = editor;
          }}
        />
      </TabsContent>
      <TabsContent value="masm" className="h-full">
        {script.masm ? (
          <Editor script={script} file="masm" readOnly />
        ) : (
          // Shown when the MASM goes while its tab is open: a failed compile
          // started from it (Cmd+S), or a `?tab=masm` link to a draft.
          <p className="flex h-full items-center justify-center border p-6 text-xs text-muted-foreground">
            {NO_MASM}
          </p>
        )}
      </TabsContent>
      <TabsContent value="manifest" className="h-full overflow-y-auto">
        <ScriptManifest script={script} />
      </TabsContent>
    </>
  );
  return (
    <div
      className={cn(
        "flex flex-col gap-4 px-4",
        isMobile && tutorialId
          ? MOBILE_TUTORIAL_PAGE_HEIGHT_CLASS_NAME
          : PAGE_HEIGHT_CLASS_NAME,
      )}
    >
      <Tabs
        className="min-h-0 flex-1"
        value={tab}
        // The default tab (MASM for the MASM-only built-ins) has no `?tab=`.
        onValueChange={(value) =>
          navigate(
            value === defaultTab
              ? pathname
              : `${pathname}?${new URLSearchParams({ tab: value })}`,
          )
        }
      >
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            {masmOnly ? (
              <Tooltip>
                <TooltipTrigger
                  delay={300}
                  render={<span className="flex h-full flex-1" />}
                >
                  <TabsTrigger value="explorer" disabled>
                    Explorer
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>{NO_RUST}</TooltipContent>
              </Tooltip>
            ) : (
              <TabsTrigger value="explorer">Explorer</TabsTrigger>
            )}
            {/* Always there, so the tabs keep their width (the Explorer's
                files line up with them): disabled until a compile succeeds.
                A disabled tab ignores the pointer: the tooltip goes on a
                wrapper. */}
            {script.masm ? (
              <TabsTrigger value="masm">MASM</TabsTrigger>
            ) : (
              <Tooltip>
                <TooltipTrigger
                  delay={300}
                  render={<span className="flex h-full flex-1" />}
                >
                  <TabsTrigger value="masm" disabled>
                    MASM
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>{NO_MASM}</TooltipContent>
              </Tooltip>
            )}
            <TabsTrigger value="manifest">Manifest</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-1">
            <EditorSettingsMenu />
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
              defaultSize={isMobile ? undefined : "65%"}
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
              defaultSize={isMobile ? CONSOLE_HEADER_HEIGHT : "35%"}
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
