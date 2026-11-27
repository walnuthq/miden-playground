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
import { type CodeEditor, currentPosition } from "@/components/lib/editor";
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
import ShareScriptButton from "@/components/script/share-script-button";
import SharedScriptBanner from "@/components/script/shared-script-banner";
import useCompileScript from "@/hooks/use-compile-script";
import useScriptShortcuts, {
  shortcutLabel,
} from "@/hooks/use-script-shortcuts";
import useTutorials from "@/hooks/use-tutorials";
import { clearConsoleLog } from "@/lib/console-log";
import { canSimulate } from "@/lib/simulation/can-simulate";
import type { Script } from "@/lib/types/script";
import { isValidUUIDv4 } from "@/lib/utils";
import { scriptSourcePath } from "@/lib/utils/script-files";

// Puts the cursor on a location of the last compile's output. The code may have
// changed since the compile: follow the location.
const reveal = (editor: CodeEditor, location: EditorLocation) => {
  const position = currentPosition(editor, location);
  editor.setPosition(position);
  editor.revealPositionInCenter(position);
  editor.focus();
};

const NO_SOURCE = "This library ships compiled, without its source.";

// The script page fills the viewport below the header (`h-16`, `h-12` with the
// icon sidebar), so the editor and the console scroll, not the page.
const PAGE_HEIGHT_CLASS_NAME =
  "h-[calc(100svh-4rem)] group-has-data-[collapsible=icon]/sidebar-wrapper:h-[calc(100svh-3rem)]";
// On a phone, a tutorial's closed panel (`h-12`) sits below the page too.
const MOBILE_TUTORIAL_PAGE_HEIGHT_CLASS_NAME = "h-[calc(100svh-7rem)]";

const ScriptComponent = ({
  id,
  script,
  // The script can't be changed from here (hooks/use-script.ts): it shows
  // read-only, under a banner that offers to fork it.
  shared = false,
}: {
  id: string;
  script?: Script;
  shared?: boolean;
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  // The source's editor, for the console's links to its locations.
  const editorRef = useRef<CodeEditor | null>(null);
  // A link clicked while the source is hidden (another tab or file), revealed
  // once it shows.
  const pendingReveal = useRef<EditorLocation | null>(null);
  // The source's path, named after the script: "" until a shared script
  // arrives from the API.
  const sourcePath = script ? scriptSourcePath(script) : "";
  // The Explorer's open files, the source only at first (undefined until a
  // file is opened or closed).
  const [openPathsState, setOpenPaths] = useState<string[]>();
  const [activePathState, setActivePath] = useState<string | null>();
  const openPaths = openPathsState ?? [sourcePath];
  const activePath =
    activePathState === undefined ? sourcePath : activePathState;
  const openFile = (path: string) => {
    setOpenPaths((paths = [sourcePath]) =>
      paths.includes(path) ? paths : [...paths, path],
    );
    setActivePath(path);
  };
  // Closing the active tab activates the one that takes its place, or the new
  // last one.
  const closeFile = (path: string) => {
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
  // The built-in libraries have no source, so no files for the Explorer. Not
  // just an empty source: an editable script's can be cleared.
  const noSource = !!script && script.files[sourcePath] === undefined;
  const defaultTab = noSource ? "manifest" : "explorer";
  // The tabs were called `rust` and `metadata` before the Explorer, and the
  // compiler's MASM had its own tab before the source was MASM.
  const tabParam = searchParams.get("tab");
  const requestedTab =
    tabParam === "rust" || tabParam === "masm"
      ? "explorer"
      : tabParam === "metadata"
        ? "manifest"
        : (tabParam ?? defaultTab);
  // A `?tab=explorer` link to a library shows its manifest.
  const tab =
    noSource && requestedTab === "explorer" ? "manifest" : requestedTab;
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
  // An editable script always has its console. A read-only one has it for
  // its Simulate tab, when it can be simulated: no Compile button, nothing to
  // compile.
  const hasConsole =
    script !== undefined && (!script.readOnly || canSimulate(script));
  useScriptShortcuts({
    compileEnabled: script !== undefined && !script.readOnly,
    consoleEnabled: hasConsole,
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
      activePath !== sourcePath ||
      !editor ||
      !location
    ) {
      return;
    }
    pendingReveal.current = null;
    // Measure it now it's visible, or the reveal centers in a zero-size view.
    editor.layout();
    reveal(editor, location);
  }, [tab, activePath, sourcePath]);
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
    if (tab === "explorer" && activePath === sourcePath && editor) {
      reveal(editor, location);
      return;
    }
    pendingReveal.current = location;
    openFile(sourcePath);
    if (tab !== "explorer") {
      navigate(pathname);
    }
  };
  const tabs = (
    <>
      {/* Kept mounted across tabs: the source's undo history, scroll
          position and compile markers survive a look at the manifest. The
          hidden source editor stays in the DOM and first in
          `monaco.editor.getEditors()`: scope e2e locators to the visible
          tab. */}
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
      {shared && <SharedScriptBanner script={script} />}
      <Tabs
        className="min-h-0 flex-1"
        value={tab}
        // The default tab (the manifest for the libraries) has no `?tab=`.
        onValueChange={(value) =>
          navigate(
            value === defaultTab
              ? pathname
              : `${pathname}?${new URLSearchParams({ tab: value })}`,
          )
        }
      >
        {/* Wraps on the narrowest phones (under ~380 px): the editor settings
            and the Compile button go under the tabs, on the right. */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            {noSource ? (
              <Tooltip>
                <TooltipTrigger
                  delay={300}
                  render={<span className="flex h-full flex-1" />}
                >
                  <TabsTrigger value="explorer" disabled>
                    Explorer
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>{NO_SOURCE}</TooltipContent>
              </Tooltip>
            ) : (
              <TabsTrigger value="explorer">Explorer</TabsTrigger>
            )}
            <TabsTrigger value="manifest">Manifest</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-1">
            {/* The API's scripts have a link to share: not the built-in
                ones. */}
            {isValidUUIDv4(script.id) && <ShareScriptButton script={script} />}
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
        {!hasConsole ? (
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
                readOnly={script.readOnly}
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
