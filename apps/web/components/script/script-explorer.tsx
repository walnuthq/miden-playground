import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { cn } from "@workspace/ui/lib/utils";
import { useId } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import Editor from "@/components/lib/editor";
import EditorTabs from "@/components/script/editor-tabs";
import FileExplorer from "@/components/script/file-explorer";
import {
  type Script,
  type ScriptFilePath,
  scriptFilePaths,
} from "@/lib/types/script";
import { buildFileTree } from "@/lib/utils/file-tree";
import { SCRIPT_FILE } from "@/lib/utils/script-files";

// The Explorer tab: the script's files on the left, the open ones as tabs on
// the right, like VS Code. The page owns the open tabs, to open the source
// from the console's links.
const ScriptExplorer = ({
  script,
  openPaths,
  activePath,
  onOpen,
  onClose,
  onMountSource,
}: {
  script: Script;
  openPaths: ScriptFilePath[];
  activePath: ScriptFilePath | null;
  onOpen: (path: ScriptFilePath) => void;
  onClose: (path: ScriptFilePath) => void;
  onMountSource: Parameters<typeof Editor>[0]["onMount"];
}) => {
  const panelId = useId();
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "script-explorer-layout",
    panelIds: ["files", "editors"],
    storage: localStorage,
    onlySaveAfterUserInteractions: true,
  });
  const paths = scriptFilePaths.filter(
    (path) => script.files[path] !== undefined,
  );
  // A MASM-only built-in has no file to show.
  const shownPaths = openPaths.filter((path) => paths.includes(path));
  const shownPath =
    activePath && paths.includes(activePath) ? activePath : null;
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full border"
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
    >
      <ResizablePanel id="files" defaultSize={215} minSize={120}>
        <FileExplorer
          tree={buildFileTree(paths)}
          activePath={shownPath}
          onOpen={(path) => onOpen(path as ScriptFilePath)}
        />
      </ResizablePanel>
      <ResizableHandle className="bg-border" />
      <ResizablePanel id="editors" minSize="40%">
        <div className="flex h-full min-w-0 flex-col">
          <EditorTabs
            openPaths={shownPaths}
            activePath={shownPath}
            readOnlyPaths={paths.filter(
              (path) => script.readOnly || path !== SCRIPT_FILE,
            )}
            panelId={panelId}
            onSelect={(path) => onOpen(path as ScriptFilePath)}
            onClose={(path) => onClose(path as ScriptFilePath)}
          />
          <div id={panelId} role="tabpanel" className="min-h-0 flex-1">
            {/* Mounted while closed or hidden: its undo history, scroll
                position and compile markers survive, and the console's links
                reveal locations in it. */}
            {paths.includes(SCRIPT_FILE) && (
              <div
                className={cn("h-full", shownPath !== SCRIPT_FILE && "hidden")}
              >
                <Editor
                  script={script}
                  file={SCRIPT_FILE}
                  readOnly={script.readOnly}
                  onMount={onMountSource}
                />
              </div>
            )}
            {shownPath && shownPath !== SCRIPT_FILE && (
              <Editor key={shownPath} script={script} file={shownPath} />
            )}
            {!shownPath && (
              <p className="flex h-full items-center justify-center p-6 text-xs text-muted-foreground">
                Select a file in the explorer.
              </p>
            )}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default ScriptExplorer;
