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
import useNotes from "@/hooks/use-notes";
import { verifyNoteFromSource } from "@/lib/api";
import { clientGetInputNote } from "@/lib/web-client";
import useWebClient from "@/hooks/use-web-client";
import { toBase64, readFile } from "@/lib/utils";

const VerifyNoteScriptDialog = () => {
  const { client } = useWebClient();
  const {
    verifyNoteScriptDialogOpen,
    verifyNoteScriptDialogNoteId: noteId,
    closeVerifyNoteScriptDialog,
  } = useNotes();
  const [loading, setLoading] = useState(false);
  const [cargoToml, setCargoToml] = useState("");
  const [rust, setRust] = useState("");
  const onClose = () => {
    setCargoToml("");
    setRust("");
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
            setLoading(true);
            const record = await clientGetInputNote({ client, noteId });
            if (!record) {
              return;
            }
            const verified = await verifyNoteFromSource({
              noteId,
              note: toBase64(record.toInputNote().note().serialize()),
              cargoToml,
              rust,
            });
            setLoading(false);
            if (verified) {
              toast.success("Note script verified.");
            } else {
              toast.error("Note script couldn't be verified.");
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
                // webkitdirectory=""
                multiple
                onChange={async (event) => {
                  const { files } = event.target;
                  if (!files) {
                    return;
                  }
                  const filesArray = Array.from(files);
                  const cargoTomlFile = filesArray.find(
                    ({ name }) => name === "Cargo.toml"
                  );
                  const rustFile = filesArray.find(
                    ({ name }) => name === "lib.rs"
                  );
                  if (!cargoTomlFile || !rustFile) {
                    return;
                  }
                  const [cargoTomlContent, rustContent] = await Promise.all([
                    readFile(cargoTomlFile),
                    readFile(rustFile),
                  ]);
                  setCargoToml(cargoTomlContent);
                  setRust(rustContent);
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
            disabled={loading || !cargoToml || !rust}
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
