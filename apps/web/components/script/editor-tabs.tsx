import { buttonVariants } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { X } from "lucide-react";
import FileIcon from "@/components/script/file-icon";

const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);

// The open files as tabs, after miden-source-code-verification's web-viewer.
// Each tab is a select button with a sibling close button (a close button
// inside the tab would nest buttons). The editors are the caller's: the
// source's stays mounted while its tab is closed.
const EditorTabs = ({
  openPaths,
  activePath,
  readOnlyPaths,
  panelId,
  onSelect,
  onClose,
  className,
}: {
  openPaths: string[];
  activePath: string | null;
  readOnlyPaths: string[];
  panelId: string;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
  className?: string;
}) => (
  <div
    role="tablist"
    aria-label="Open files"
    className={cn(
      "flex h-8 shrink-0 overflow-x-auto border-b bg-muted/50",
      className,
    )}
  >
    {openPaths.map((path) => {
      const isActive = path === activePath;
      return (
        <div
          key={path}
          className={cn(
            "flex shrink-0 items-center border-r",
            isActive && "bg-background",
          )}
        >
          <button
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={panelId}
            title={readOnlyPaths.includes(path) ? `${path} (read-only)` : path}
            onClick={() => onSelect(path)}
            className={cn(
              "flex h-full items-center gap-1.5 pr-1 pl-3 text-xs whitespace-nowrap outline-none focus-visible:ring-1 focus-visible:ring-ring/50",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <FileIcon path={path} className="size-3.5" />
            {basename(path)}
          </button>
          <button
            type="button"
            aria-label={`Close ${path}`}
            onClick={() => onClose(path)}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-xs" }),
              "mr-1",
            )}
          >
            <X />
          </button>
        </div>
      );
    })}
  </div>
);

export default EditorTabs;
