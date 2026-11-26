import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Spinner } from "@workspace/ui/components/spinner";
import { cn } from "@workspace/ui/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import useScripts from "@/hooks/use-scripts";
import {
  fileListToPackageSources,
  type PickedProjects,
} from "@/lib/utils/script";

const NOTHING_PICKED: PickedProjects = { packageSources: {}, refused: [] };

const ImportProjectDialog = () => {
  const {
    importProjectDialogOpen,
    closeImportProjectDialog,
    importScriptsFromPackageSources,
  } = useScripts();
  const [loading, setLoading] = useState(false);
  const [{ packageSources, refused }, setPicked] =
    useState<PickedProjects>(NOTHING_PICKED);
  // Whether a folder was picked, to tell an empty one apart.
  const [picked, setFolderPicked] = useState(false);
  const packageDirectories = Object.keys(packageSources);
  const onClose = () => {
    setPicked(NOTHING_PICKED);
    setFolderPicked(false);
    closeImportProjectDialog();
  };
  return (
    <Dialog
      open={importProjectDialogOpen}
      modal={false}
      disablePointerDismissal
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent data-modal="false" className="sm:max-w-160">
        <DialogHeader>
          <DialogTitle>Import Project</DialogTitle>
          <DialogDescription>
            Import a Miden Assembly project, or a folder of projects that depend
            on each other. Each project needs a miden-project.toml whose [lib]
            path names its .masm file.
          </DialogDescription>
        </DialogHeader>
        <form
          id="import-project-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            try {
              const { scripts, error } =
                await importScriptsFromPackageSources(packageSources);
              if (scripts) {
                toast.success(
                  `Successfully imported project, found ${scripts.length} ${scripts.length === 1 ? "script" : "scripts"}.`,
                );
                onClose();
              } else {
                toast.error("Failed to import project.", {
                  description: error,
                });
              }
            } catch (error) {
              console.error(error);
              toast.error("Failed to import project.", {
                description:
                  error instanceof Error ? error.message : String(error),
              });
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="project-dir">Project Directory</Label>
              <Input
                id="project-dir"
                type="file"
                webkitdirectory=""
                onChange={async (event) => {
                  const { files } = event.target;
                  if (!files) {
                    return;
                  }
                  setPicked(await fileListToPackageSources(files));
                  setFolderPicked(true);
                }}
              />
            </div>
          </div>
          {picked && (
            <div className="mt-4 text-sm">
              {packageDirectories.length === 0 ? (
                refused.length === 0 && (
                  <p className="text-destructive">
                    No project found: no directory has a miden-project.toml.
                  </p>
                )
              ) : (
                <>
                  <p className="text-muted-foreground">
                    Found {packageDirectories.length}{" "}
                    {packageDirectories.length === 1 ? "project" : "projects"}:
                  </p>
                  <ul className="mt-1 list-inside list-disc font-mono">
                    {packageDirectories.map((directory) => (
                      <li key={directory}>{directory}</li>
                    ))}
                  </ul>
                </>
              )}
              {refused.length > 0 && (
                <>
                  <p
                    className={cn(
                      "text-destructive",
                      packageDirectories.length > 0 && "mt-2",
                    )}
                  >
                    Can&apos;t import:
                  </p>
                  <ul className="mt-1 list-inside list-disc text-destructive">
                    {refused.map(({ directory, reason }) => (
                      <li key={directory}>
                        <span className="font-mono">{directory || "."}</span>:{" "}
                        {reason}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            form="import-project-form"
            type="submit"
            disabled={loading || packageDirectories.length === 0}
          >
            {loading && <Spinner />}
            {loading ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportProjectDialog;
