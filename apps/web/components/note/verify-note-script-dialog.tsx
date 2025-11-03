"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@workspace/ui/components/spinner";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import useNotes from "@/hooks/use-notes";
import useScripts from "@/hooks/use-scripts";

const VerifyNoteScriptDialog = () => {
  const {
    verifyNoteScriptDialogOpen,
    verifyNoteScriptDialogNoteId: noteId,
    verifyNoteScript,
    closeVerifyNoteScriptDialog,
  } = useNotes();
  const { scripts } = useScripts();
  const [loading, setLoading] = useState(false);
  const [scriptId, setScriptId] = useState("");
  const shownScripts = scripts.filter(({ type }) => type === "note");
  const onClose = () => {
    setScriptId("");
    closeVerifyNoteScriptDialog();
  };
  return (
    <Dialog
      open={verifyNoteScriptDialogOpen}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="sm:max-w-[640px] z-100"
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
            const verified = await verifyNoteScript({
              noteId,
              scriptId,
            });
            setLoading(false);
            if (verified) {
              toast.success("Note script verified");
            } else {
              toast.error("Note script couldn't be verified");
            }
            onClose();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="script">Script</Label>
              <Select onValueChange={setScriptId} value={scriptId}>
                <SelectTrigger
                  className="w-[180px]"
                  disabled={shownScripts.length === 0}
                >
                  <SelectValue placeholder="Select script…" />
                </SelectTrigger>
                <SelectContent>
                  {shownScripts.map((script) => (
                    <SelectItem key={script.id} value={script.id}>
                      {script.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            disabled={loading || scriptId === ""}
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
