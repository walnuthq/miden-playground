"use client";
import { useState } from "react";
// import { toast } from "sonner";
import { Trash } from "lucide-react";
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
import { Input } from "@workspace/ui/components/input";
import useNotes from "@/hooks/use-notes";
import useScripts from "@/hooks/use-scripts";
import { noteTypes, type NoteType } from "@/lib/types/note";
import SelectAccountDropdownMenu from "@/components/transactions/select-account-dropdown-menu";
import { decodeFungibleFaucetMetadata } from "@/lib/types/account";
import { useWallet } from "@demox-labs/miden-wallet-adapter";
import useAccounts from "@/hooks/use-accounts";
import { parseAmount } from "@/lib/utils";

const CreateNoteDialog = () => {
  const { accountId } = useWallet();
  const { wallets, faucets } = useAccounts();
  const { createNoteDialogOpen, closeCreateNoteDialog, newNote } = useNotes();
  const { scripts } = useScripts();
  const [loading, setLoading] = useState(false);
  const [recipientAccountId, setRecipientAccountId] = useState("");
  const [scriptId, setScriptId] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("public");
  const [hasAssets, setHasAssets] = useState(false);
  const [faucetAccountId, setFaucetAccountId] = useState("");
  const [noteInputs, setNoteInputs] = useState<string[]>([]);
  const shownScripts = scripts.filter(({ type }) => type === "note");
  const onClose = () => {
    setRecipientAccountId("");
    setScriptId("");
    setNoteType("public");
    setFaucetAccountId("");
    setNoteInputs([]);
    closeCreateNoteDialog();
  };
  const faucetAccount = faucets.find(({ id }) => id === faucetAccountId);
  const { decimals } = decodeFungibleFaucetMetadata(faucetAccount);
  return (
    <Dialog
      open={createNoteDialogOpen}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="sm:max-w-[640px] z-100"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create Note</DialogTitle>
          <DialogDescription>
            Create a custom note from script.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-note-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const senderAccount = wallets.find(
              ({ address }) => address === accountId
            );
            // const recipientAccountId =
            //   noteInputs.length >= 2
            //     ? accountIdFromPrefixSuffix(
            //         noteInputs[1] ?? "0x0",
            //         noteInputs[0] ?? "0x0"
            //       )
            //     : "";
            const amount = parseAmount(
              formData.get("amount")?.toString() ?? "0",
              decimals
            );
            setLoading(true);
            // const transactionRecord =
            await newNote({
              senderAccountId: senderAccount?.id ?? "",
              recipientAccountId,
              scriptId,
              type: noteType,
              faucetAccountId,
              amount,
              noteInputs,
            });
            setLoading(false);
            // toast("Transaction submitted.", {
            //   action: {
            //     label: "View on MidenScan",
            //     onClick: () =>
            //       window.open(
            //         `https://testnet.midenscan.com/tx/${transactionRecord.id().toHex()}`,
            //         "_blank",
            //         "noopener noreferrer"
            //       ),
            //   },
            // });
            onClose();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3 col-span-2">
              <Label>Recipient account</Label>
              <SelectAccountDropdownMenu
                value={recipientAccountId}
                onValueChange={setRecipientAccountId}
              />
            </div>
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
            <div className="grid gap-3">
              <Label htmlFor="type">Note type</Label>
              <Select
                onValueChange={(value) => setNoteType(value as NoteType)}
                value={noteType}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select note type…" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(noteTypes).map((type) => (
                    <SelectItem key={type} value={type}>
                      {noteTypes[type as NoteType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label>Note assets</Label>
              {hasAssets && (
                <SelectAccountDropdownMenu
                  value={faucetAccountId}
                  onValueChange={setFaucetAccountId}
                  selectFaucets
                  showFaucetsAsAssets
                />
              )}
            </div>
            {hasAssets && (
              <div className="grid gap-3">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min={1 / 10 ** Number(decimals)}
                  step={1 / 10 ** Number(decimals)}
                  required
                />
              </div>
            )}
            <div className="grid gap-3 col-span-2">
              <Button
                type="button"
                variant={hasAssets ? "destructive" : "secondary"}
                onClick={() => setHasAssets(!hasAssets)}
              >
                {hasAssets ? "Remove" : "Add"} note assets
              </Button>
            </div>
            <div className="grid gap-3 col-span-2">
              <Label htmlFor="inputs">Note inputs</Label>
              {noteInputs.map((noteInput, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    id={`input-${index}`}
                    name={`input-${index}`}
                    placeholder={`Note input #${index}`}
                    type="number"
                    min="0"
                    value={noteInput}
                    onChange={(event) =>
                      setNoteInputs([
                        ...noteInputs.slice(0, index),
                        event.target.value,
                        ...noteInputs.slice(index + 1),
                      ])
                    }
                    required
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="size-8"
                    onClick={() =>
                      setNoteInputs([
                        ...noteInputs.slice(0, index),
                        ...noteInputs.slice(index + 1),
                      ])
                    }
                  >
                    <Trash />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                onClick={() => setNoteInputs([...noteInputs, ""])}
              >
                Add note input
              </Button>
            </div>
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            form="create-note-form"
            type="submit"
            disabled={
              loading ||
              recipientAccountId === "" ||
              scriptId === "" ||
              (hasAssets ? faucetAccountId === "" : false)
            }
          >
            {loading && <Spinner />}
            {loading ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNoteDialog;
