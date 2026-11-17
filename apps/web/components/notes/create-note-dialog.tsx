import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Spinner } from "@workspace/ui/components/spinner";
import { Switch } from "@workspace/ui/components/switch";
import { TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import NoteStorageFields from "@/components/procedures/note-storage-fields";
import SimulationResultDialog, {
  type SimulatedTransaction,
} from "@/components/script/simulate/simulation-result-dialog";
import SelectAccountCombobox from "@/components/transactions/select-account-combobox";
import SelectAccountDropdownMenu from "@/components/transactions/select-account-dropdown-menu";
import useAccounts from "@/hooks/use-accounts";
import useNotePreview from "@/hooks/use-note-preview";
import useNotes from "@/hooks/use-notes";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import { type NoteType, noteTypes } from "@/lib/types/note";
import { formatAmount, parseAmount } from "@/lib/utils/asset";
import {
  createNoteStorageParams,
  emptyNoteStorage,
  type NoteStorageInput,
  noteStorageInputFelts,
  noteStorageInputReady,
  typedToRawNoteStorage,
} from "@/lib/utils/note-storage";
import { cleanExecutionError } from "@/lib/utils/procedure-inputs";
import { accountIdParts } from "@/lib/web-client";

// The amount in base units, or nothing when it isn't a positive amount.
const parsedAmount = (amount: string, decimals?: number) => {
  try {
    const parsed = parseAmount(amount.trim(), decimals);
    return parsed > 0n ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const CreateNoteDialog = () => {
  const { connectedWallet, accounts, faucets } = useAccounts();
  const { createNoteDialogOpen, closeCreateNoteDialog, newNote } = useNotes();
  const { previewConsumption } = useNotePreview();
  const { scripts } = useScripts();
  const [loading, setLoading] = useState(false);
  const [recipientAccountId, setRecipientAccountId] = useState("");
  const [scriptId, setScriptId] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("public");
  const [isNetworkNote, setIsNetworkNote] = useState(false);
  const [hasAssets, setHasAssets] = useState(false);
  const [faucetAccountId, setFaucetAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [noteStorage, setNoteStorage] =
    useState<NoteStorageInput>(emptyNoteStorage);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<SimulatedTransaction>();
  // A failed preview's reason, for the inputs it ran with: any change hides
  // it.
  const [previewFailure, setPreviewFailure] = useState<{
    inputs: string;
    error: string;
  }>();
  // False once the dialog is closed: a preview that ends after it leaves the
  // dialog alone.
  const open = useRef(createNoteDialogOpen);
  useEffect(() => {
    open.current = createNoteDialogOpen;
  }, [createNoteDialogOpen]);
  const shownScripts = scripts.filter(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "note",
  );
  const script = shownScripts.find(({ id }) => id === scriptId);
  // Typed fields when the script's schema can type them all, raw felts
  // otherwise.
  const noteStorageParams = script && createNoteStorageParams(script);
  const onClose = () => {
    setRecipientAccountId("");
    setScriptId("");
    setNoteType("public");
    setIsNetworkNote(false);
    setHasAssets(false);
    setFaucetAccountId("");
    setAmount("");
    setNoteStorage(emptyNoteStorage());
    setPreview(undefined);
    setPreviewFailure(undefined);
    closeCreateNoteDialog();
  };
  const faucetAccount = faucets.find(({ id }) => id === faucetAccountId);
  const noteAmount = hasAssets
    ? parsedAmount(amount, faucetAccount?.decimals)
    : 0n;
  const storageReady = noteStorageInputReady(noteStorageParams, noteStorage);
  const createReady =
    recipientAccountId !== "" &&
    scriptId !== "" &&
    (hasAssets ? faucetAccountId !== "" : true) &&
    storageReady;
  const noteFelts = () =>
    noteStorageInputFelts({
      params: noteStorageParams,
      input: noteStorage,
      accountIdParts,
    });
  // What a preview runs with, to tell whether a failure is still current.
  const inputs = JSON.stringify({
    recipientAccountId,
    scriptId,
    noteType,
    isNetworkNote,
    hasAssets,
    faucetAccountId,
    amount,
    noteStorage,
    sender: connectedWallet?.id,
  });
  const failure =
    previewFailure?.inputs === inputs ? previewFailure.error : undefined;
  const recipient = accounts.find(({ id }) => id === recipientAccountId);
  const runPreview = async () => {
    if (!script || noteAmount === undefined) {
      return;
    }
    setPreviewing(true);
    setPreviewFailure(undefined);
    const ranWith = inputs;
    try {
      const { result, account } = await previewConsumption({
        senderAccountId: connectedWallet?.id ?? "",
        recipientAccountId,
        scriptId,
        noteType,
        isNetworkNote,
        assets: hasAssets
          ? [{ faucetId: faucetAccountId, amount: noteAmount }]
          : [],
        noteStorage: noteFelts(),
      });
      if (!open.current) {
        return;
      }
      if (!result.ok || !result.executedTransaction || !account) {
        setPreviewFailure({
          inputs: ranWith,
          error: result.ok ? "The preview gave no transaction." : result.error,
        });
        return;
      }
      setPreview({
        name: script.name,
        value: "",
        executedTransaction: result.executedTransaction,
        baseline: account,
        throwaway: false,
      });
    } catch (error) {
      console.error(error);
      if (open.current) {
        setPreviewFailure({
          inputs: ranWith,
          error: cleanExecutionError(
            error instanceof Error ? error.message : String(error),
          ),
        });
      }
    } finally {
      setPreviewing(false);
    }
  };
  return (
    <Dialog
      open={createNoteDialogOpen}
      modal={false}
      disablePointerDismissal
      onOpenChange={(open) => !open && onClose()}
    >
      {/* A column that can shrink to the dialog's width (a grid's can't, by
          default), so the fields stay on a phone's screen. Taller than the
          screen, the dialog scrolls. */}
      <DialogContent
        data-modal="false"
        className="max-h-[calc(100dvh-2rem)] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-160"
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
            setLoading(true);
            try {
              const submitted = await newNote({
                senderAccountId: connectedWallet?.id ?? "",
                recipientAccountId,
                scriptId,
                type: noteType,
                isNetworkNote,
                faucetAccountId: hasAssets ? faucetAccountId : "",
                amount: hasAssets
                  ? parseAmount(amount, faucetAccount?.decimals)
                  : 0n,
                noteStorage: noteFelts(),
              });
              // Keep the dialog open when the transaction is rejected in the
              // wallet, to let the user try again.
              if (submitted) {
                onClose();
              }
            } catch (error) {
              console.error(error);
              toast.error("Failed to create note.", {
                description:
                  error instanceof Error ? error.message : String(error),
              });
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="grid min-w-0 gap-4 sm:grid-cols-3">
            <div className="grid gap-3 sm:col-span-3">
              <Label>Recipient account</Label>
              <SelectAccountCombobox onValueChange={setRecipientAccountId} />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="script">Script</Label>
              <Select
                items={shownScripts.map(({ id, name }) => ({
                  value: id,
                  label: name,
                }))}
                onValueChange={(value) => {
                  // Another script's values mean nothing to this one's
                  // fields.
                  if ((value ?? "") !== scriptId) {
                    setNoteStorage(emptyNoteStorage());
                  }
                  setScriptId(value ?? "");
                }}
                value={scriptId || null}
              >
                <SelectTrigger
                  className="w-45 max-w-full"
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
                <SelectTrigger className="w-45 max-w-full">
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
              <Label htmlFor="is-network-note">Network note</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="is-network-note"
                  name="is-network-note"
                  checked={isNetworkNote}
                  onCheckedChange={(checked) => setIsNetworkNote(checked)}
                />
                <Label>{isNetworkNote ? "Network note" : "Regular note"}</Label>
              </div>
            </div>
            <div className="grid gap-3 sm:col-span-3">
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
              <div className="grid gap-3 sm:col-span-3">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step={formatAmount({
                    amount: "1",
                    decimals: faucetAccount?.decimals,
                  }).replaceAll(",", "")}
                  min={formatAmount({
                    amount: "1",
                    decimals: faucetAccount?.decimals,
                  }).replaceAll(",", "")}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                />
              </div>
            )}
            <div className="grid gap-3 sm:col-span-3">
              <Button
                type="button"
                variant={hasAssets ? "destructive" : "secondary"}
                onClick={() => setHasAssets(!hasAssets)}
              >
                {hasAssets ? "Remove" : "Add"} note assets
              </Button>
            </div>
            <NoteStorageFields
              idPrefix="create-note-storage"
              className="sm:col-span-3"
              schema={script?.metadata?.noteStorage}
              params={noteStorageParams}
              args={noteStorage.args}
              onArgsChange={(args) => setNoteStorage({ ...noteStorage, args })}
              felts={noteStorage.felts}
              onFeltsChange={(felts) =>
                setNoteStorage({ ...noteStorage, felts })
              }
              raw={noteStorage.raw}
              onRawChange={(raw) => {
                // Prefilled with the typed values' felts, when they're
                // valid. Back to typed, the typed values are as they were.
                const felts =
                  raw && noteStorageParams
                    ? typedToRawNoteStorage({
                        params: noteStorageParams,
                        args: noteStorage.args,
                        accountIdParts,
                      })
                    : [];
                setNoteStorage({
                  ...noteStorage,
                  raw,
                  felts: felts.length > 0 ? felts : noteStorage.felts,
                });
              }}
            />
          </div>
        </form>
        {failure && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>The preview failed.</AlertTitle>
            <AlertDescription>
              <p className="whitespace-pre-wrap break-words">{failure}</p>
              <p>This doesn't stop you from creating the note.</p>
            </AlertDescription>
          </Alert>
        )}
        <p className="text-xs text-muted-foreground">
          The preview runs the note against the recipient's state now, at the
          current block, without creating it: the outcome can differ when the
          note is consumed.
        </p>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            variant="secondary"
            disabled={
              previewing || loading || !createReady || noteAmount === undefined
            }
            onClick={runPreview}
          >
            {previewing && <Spinner />}
            {previewing ? "Previewing…" : "Preview consumption"}
          </Button>
          <Button
            form="create-note-form"
            type="submit"
            disabled={loading || !createReady}
          >
            {loading && <Spinner />}
            {loading ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <SimulationResultDialog
        simulation={preview}
        onClose={() => setPreview(undefined)}
        title={`Consumption preview of ${preview?.name ?? ""}`}
        description={`Nothing was submitted: the note ran locally as if ${
          recipient?.name ?? "the recipient"
        } consumed it now.`}
      />
    </Dialog>
  );
};

export default CreateNoteDialog;
