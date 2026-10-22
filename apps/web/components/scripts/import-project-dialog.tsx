"use client";
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
  const onClose = () => {
    setPackageSources({});
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
          <DialogDescription>Import a Rust project.</DialogDescription>
        </DialogHeader>
        <form
          id="import-rust-project-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            const { scripts, error } =
              await importScriptsFromPackageSources(packageSources);
            if (scripts) {
              toast.success(
                `Successfully imported Rust project, found ${scripts.length} scripts.`,
              );
            } else {
              toast.error("Failed to import Rust project.", {
                description: error,
              });
            }
            setLoading(false);
            onClose();
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
                }}
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            form="import-rust-project-form"
            type="submit"
            disabled={loading || Object.values(packageSources).length === 0}
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
