"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@workspace/ui/components/spinner";
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
import { fileListToPackageSources } from "@/lib/utils/script";
import type { PackageSource } from "@/lib/types/script";
import useScripts from "@/hooks/use-scripts";

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
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="sm:max-w-160 z-100"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
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
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
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
