import { buttonVariants } from "@workspace/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronRight, Folder } from "lucide-react";
import FileIcon from "@/components/script/file-icon";
import type { FileTreeNode } from "@/lib/utils/file-tree";

type FileTreeProps = {
  nodes: FileTreeNode[];
  activePath: string | null;
  onOpen: (path: string) => void;
};

// After miden-source-code-verification's web-viewer. Folders start expanded.
const FileTree = ({ nodes, activePath, onOpen }: FileTreeProps) => (
  <ul className="flex flex-col">
    {nodes.map((node) => (
      <li key={node.path}>
        {node.children ? (
          <Collapsible defaultOpen>
            {/* The ghost variant highlights expanded triggers, as for menus,
                but an open folder isn't a selection: keep only the hover. */}
            <CollapsibleTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "w-full justify-start aria-expanded:bg-transparent aria-expanded:hover:bg-muted dark:aria-expanded:hover:bg-muted/50",
              )}
            >
              <ChevronRight
                data-icon="inline-start"
                className="transition-transform group-data-panel-open/button:rotate-90"
              />
              <Folder />
              <span className="truncate">{node.name}</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-3.5 border-l pl-1">
              <FileTree
                nodes={node.children}
                activePath={activePath}
                onOpen={onOpen}
              />
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <button
            type="button"
            title={node.path}
            aria-current={node.path === activePath ? "true" : undefined}
            onClick={() => onOpen(node.path)}
            className={cn(
              buttonVariants({
                variant: node.path === activePath ? "secondary" : "ghost",
                size: "sm",
              }),
              "w-full justify-start",
            )}
          >
            <FileIcon path={node.path} />
            <span className="truncate">{node.name}</span>
          </button>
        )}
      </li>
    ))}
  </ul>
);

const FileExplorer = ({
  tree,
  activePath,
  onOpen,
}: {
  tree: FileTreeNode[];
  activePath: string | null;
  onOpen: (path: string) => void;
}) => (
  <nav aria-label="Files" className="flex h-full min-h-0 flex-col">
    <div className="flex h-8 shrink-0 items-center border-b px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
      Explorer
    </div>
    <div className="min-h-0 flex-1 overflow-auto p-1">
      <FileTree nodes={tree} activePath={activePath} onOpen={onOpen} />
    </div>
  </nav>
);

export default FileExplorer;
