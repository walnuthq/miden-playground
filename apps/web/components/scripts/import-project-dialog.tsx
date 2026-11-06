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
import { useState } from "react";
import { toast } from "sonner";
import useScripts from "@/hooks/use-scripts";
import type { PackageSource } from "@/lib/types/script";
import { fileListToPackageSources } from "@/lib/utils/script";

const ImportProjectDialog = () => {
  const {
    importProjectDialogOpen,
    closeImportProjectDialog,
    importScriptsFromPackageSources,
  } = useScripts();
  const [loading, setLoading] = useState(false);
  const [packageSources, setPackageSources] = useState<
    Record<string, PackageSource>
  >({});
  // Whether a folder was picked, to tell an empty one apart.
  const [picked, setPicked] = useState(false);
  const packageDirectories = Object.keys(packageSources);
  const onClose = () => {
    setPackageSources({});
    setPicked(false);
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
            Import a Rust project, or a folder of projects that depend on each
            other. Each project needs a miden-project.toml and a src/lib.rs.
          </DialogDescription>
        </DialogHeader>
        <form
          id="import-rust-project-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            try {
              const { scripts, error } =
                await importScriptsFromPackageSources(packageSources);
              if (scripts) {
                toast.success(
                  `Successfully imported Rust project, found ${scripts.length} ${scripts.length === 1 ? "script" : "scripts"}.`,
                );
                onClose();
              } else {
                toast.error("Failed to import Rust project.", {
                  description: error,
                });
              }
            } catch (error) {
              console.error(error);
              toast.error("Failed to import Rust project.", {
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
                  const packageSources = await fileListToPackageSources(files);
                  setPackageSources(packageSources);
                  setPicked(true);
                }}
              />
            </div>
          </div>
          {picked && (
            <div className="mt-4 text-sm">
              {packageDirectories.length === 0 ? (
                <p className="text-destructive">
                  No project found: no directory has both a miden-project.toml
                  and a src/lib.rs.
                </p>
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
            </div>
          )}
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            form="import-rust-project-form"
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
