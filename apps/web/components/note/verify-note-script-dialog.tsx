"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
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
import useNotes from "@/hooks/use-notes";
import { verifyNoteFromSource } from "@/lib/api";
import { toBase64 } from "@/lib/utils";
import type { PackageSource } from "@/lib/types/script";
import { parseCargoToml, fileListToPackageSources } from "@/lib/utils/script";
import useNetwork from "@/hooks/use-network";
import { useMiden } from "@miden-sdk/react";

const VerifyNoteScriptDialog = () => {
  const queryClient = useQueryClient();
  const { client } = useMiden();
  const { networkId } = useNetwork();
  const {
    verifyNoteScriptDialogOpen,
    verifyNoteScriptDialogNoteId: noteId,
    closeVerifyNoteScriptDialog,
  } = useNotes();
  const [loading, setLoading] = useState(false);
  const [packageSource, setPackageSource] = useState<PackageSource | null>(
    null,
  );
  const [dependencies, setDependencies] = useState<PackageSource[]>([]);
  const onClose = () => {
    setPackageSource(null);
    setDependencies([]);
    closeVerifyNoteScriptDialog();
  };
  return (
    <Dialog
      open={verifyNoteScriptDialogOpen}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="sm:max-w-160 z-100"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Verify Note Script</DialogTitle>
          <DialogDescription>Verify a custom note script.</DialogDescription>
        </DialogHeader>
        <form
          id="verify-note-script-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!client) {
              throw new Error("MidenClient not ready");
            }
            setLoading(true);
            const record = await client.getInputNote(noteId);
            if (!record || !packageSource) {
              return;
            }
            const { verified, error } = await verifyNoteFromSource({
              networkId,
              noteId,
              note: toBase64(record.toInputNote().note().serialize()),
              packageSource,
              dependencies,
            });
            setLoading(false);
            if (verified !== undefined) {
              if (verified) {
                toast.success("Note script verified.");
                queryClient.invalidateQueries({
                  queryKey: ["verifiedNote", networkId, noteId],
                });
              } else {
                toast.error("Note script couldn't be verified.");
              }
            } else {
              toast.error("Error while verifying Note script.", {
                description: error,
              });
            }
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
                  const packageSourcesList = Object.values(packageSources);
                  const packageSourcesParsed = packageSourcesList.map(
                    (packageSource) => ({
                      ...packageSource,
                      parsedCargoToml: parseCargoToml(packageSource.cargoToml),
                    }),
                  );
                  const notePackage = packageSourcesParsed.find(
                    ({ parsedCargoToml }) =>
                      parsedCargoToml.package.metadata.miden["project-kind"] ===
                      "note-script",
                  );
                  if (!notePackage) {
                    return;
                  }
                  setPackageSource(notePackage);
                  const rawNotePackageDependencies =
                    notePackage.parsedCargoToml.package.metadata.miden
                      .dependencies ?? {};
                  const notePackageDependencies = Object.keys(
                    rawNotePackageDependencies,
                  )
                    .map((dependency) => {
                      const { path: dependencyPath } =
                        rawNotePackageDependencies[dependency] ?? {
                          path: "",
                        };
                      const dependencyDir = dependencyPath.split("/").at(-1);
                      const packagePath =
                        Object.keys(packageSources).find((packagePath) => {
                          const packageDir = packagePath.split("/").at(-1);
                          return packageDir === dependencyDir;
                        }) ?? "";
                      return packageSources[packagePath];
                    })
                    .filter((dependency) => dependency !== undefined);
                  setDependencies(notePackageDependencies);
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
            form="verify-note-script-form"
            type="submit"
            disabled={loading || !packageSource}
          >
            {loading && <Spinner />}
            {loading ? "Verifying…" : "Verify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerifyNoteScriptDialog;
