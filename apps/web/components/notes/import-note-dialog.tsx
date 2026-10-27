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
import useNotes from "@/hooks/use-notes";
import { readFileAsArrayBuffer } from "@/lib/utils/script";

const ImportNoteDialog = () => {
  const { importNoteDialogOpen, closeImportNoteDialog, importNoteFromFile } =
    useNotes();
  const [loading, setLoading] = useState(false);
  const [noteFileBytes, setNoteFileBytes] = useState(new Uint8Array());
  return (
    <Dialog
      open={importNoteDialogOpen}
      modal={false}
      disablePointerDismissal
      onOpenChange={(open) => !open && closeImportNoteDialog()}
    >
      <DialogContent data-modal="false" className="sm:max-w-160">
        <DialogHeader>
          <DialogTitle>Import Note</DialogTitle>
          <DialogDescription>
            Import a private note from file.
          </DialogDescription>
        </DialogHeader>
        <form
          id="import-note-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            await importNoteFromFile({ noteId: "", noteFileBytes });
            setLoading(false);
            closeImportNoteDialog();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="project-dir">Note File (.mno)</Label>
              <Input
                id="note-file"
                type="file"
                accept=".mno"
                onChange={async (event) => {
                  const { files } = event.target;
                  if (!files) {
                    return;
                  }
                  const filesArray = Array.from(files);
                  const [noteFile] = filesArray;
                  if (!noteFile) {
                    return;
                  }
                  const noteArrayBuffer = await readFileAsArrayBuffer(noteFile);
                  setNoteFileBytes(new Uint8Array(noteArrayBuffer));
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
            form="import-note-form"
            type="submit"
            disabled={loading || noteFileBytes.length === 0}
          >
            {loading && <Spinner />}
            {loading ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportNoteDialog;
