import { buttonVariants } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { cn } from "@workspace/ui/lib/utils";
import { FolderTree } from "lucide-react";
import { useId } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import Editor from "@/components/lib/editor";
import EditorTabs from "@/components/script/editor-tabs";
import FileExplorer from "@/components/script/file-explorer";
import FileIcon from "@/components/script/file-icon";
import type { Script } from "@/lib/types/script";
import { buildFileTree } from "@/lib/utils/file-tree";
import { scriptFilePaths, scriptSourcePath } from "@/lib/utils/script-files";

// On a phone the file tree would leave the editor a column a few words wide:
// a menu at the start of the tabs row opens the files instead.
const FilesMenu = ({
  paths,
  activePath,
  onOpen,
}: {
  paths: string[];
  activePath: string | null;
  onOpen: (path: string) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      aria-label="Files"
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "h-8 shrink-0 rounded-none border-r border-b",
      )}
    >
      <FolderTree />
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-auto" align="start">
      {paths.map((path) => (
        <DropdownMenuItem
          key={path}
          aria-current={path === activePath ? "true" : undefined}
          onClick={() => onOpen(path)}
        >
          <FileIcon path={path} />
          {path}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

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
  openPaths: string[];
  activePath: string | null;
  onOpen: (path: string) => void;
  onClose: (path: string) => void;
  onMountSource: Parameters<typeof Editor>[0]["onMount"];
}) => {
  const panelId = useId();
  const isMobile = useIsMobile();
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "script-explorer-layout",
    panelIds: ["files", "editors"],
    storage: localStorage,
    onlySaveAfterUserInteractions: true,
  });
  const sourcePath = scriptSourcePath(script);
  const paths = scriptFilePaths(script).filter(
    (path) => script.files[path] !== undefined,
  );
  // A built-in library has no file to show.
  const shownPaths = openPaths.filter((path) => paths.includes(path));
  const shownPath =
    activePath && paths.includes(activePath) ? activePath : null;
  const editorTabs = (
    <EditorTabs
      openPaths={shownPaths}
      activePath={shownPath}
      readOnlyPaths={paths.filter(
        (path) => script.readOnly || path !== sourcePath,
      )}
      panelId={panelId}
      onSelect={onOpen}
      onClose={onClose}
      className={isMobile ? "min-w-0 flex-1" : undefined}
    />
  );
  const editors = (
    <div className="flex h-full min-w-0 flex-col">
      {isMobile ? (
        <div className="flex shrink-0">
          <FilesMenu paths={paths} activePath={shownPath} onOpen={onOpen} />
          {editorTabs}
        </div>
      ) : (
        editorTabs
      )}
      <div id={panelId} role="tabpanel" className="min-h-0 flex-1">
        {/* Mounted while closed or hidden: its undo history, scroll
                position and compile markers survive, and the console's links
                reveal locations in it. */}
        {paths.includes(sourcePath) && (
          <div className={cn("h-full", shownPath !== sourcePath && "hidden")}>
            <Editor
              script={script}
              file={sourcePath}
              readOnly={script.readOnly}
              onMount={onMountSource}
            />
          </div>
        )}
        {shownPath && shownPath !== sourcePath && (
          <Editor key={shownPath} script={script} file={shownPath} />
        )}
        {!shownPath && (
          <p className="flex h-full items-center justify-center p-6 text-xs text-muted-foreground">
            Select a file in the {isMobile ? "files menu" : "explorer"}.
          </p>
        )}
      </div>
    </div>
  );
  return isMobile ? (
    <div className="h-full border">{editors}</div>
  ) : (
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
          onOpen={onOpen}
        />
      </ResizablePanel>
      <ResizableHandle className="bg-border" />
      <ResizablePanel id="editors" minSize="40%">
        {editors}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default ScriptExplorer;
