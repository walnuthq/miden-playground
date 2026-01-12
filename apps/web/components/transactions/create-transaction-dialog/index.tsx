import { useState, useEffect } from "react";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  type ConsumableNoteRecord as WasmConsumableNoteRecordType,
  type TransactionRequest as WasmTransactionRequestType,
  type TransactionResult as WasmTransactionResultType,
} from "@demox-labs/miden-sdk";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import useTransactions from "@/hooks/use-transactions";
import useAccounts from "@/hooks/use-accounts";
import CreateTransactionSelectForm from "@/components/transactions/create-transaction-dialog/create-transaction-select-form";
import CreateTransactionConfigureForm from "@/components/transactions/create-transaction-dialog/create-transaction-configure-form";
import CreateTransactionPreviewForm from "@/components/transactions/create-transaction-dialog/create-transaction-preview-form";

const CreateTransactionDialog = () => {
  const { accounts } = useAccounts();
  const {
    createTransactionDialogOpen,
    createTransactionDialogAccountId,
    createTransactionDialogTransactionType,
    createTransactionDialogStep,
    createTransactionDialogConsumableNotes,
    createTransactionDialogNoteIds,
    createTransactionDialogTransactionRequest,
    createTransactionDialogTransactionResult,
    closeCreateTransactionDialog,
  } = useTransactions();
  const [executingAccountId, setExecutingAccountId] = useState(
    createTransactionDialogAccountId
  );
  const executingAccount = accounts.find(({ id }) => id === executingAccountId);
  const [transactionType, setTransactionType] = useState(
    createTransactionDialogTransactionType
  );
  const [step, setStep] = useState(createTransactionDialogStep);
  const [targetAccountId, setTargetAccountId] = useState("");
  const targetAccount = accounts.find(({ id }) => id === targetAccountId);
  const [isPublic, setIsPublic] = useState(true);
  const [consumableNotes, setConsumableNotes] = useState<
    WasmConsumableNoteRecordType[]
  >(createTransactionDialogConsumableNotes);
  const [noteIds, setNoteIds] = useState<string[]>(
    createTransactionDialogNoteIds
  );
  const [scriptId, setScriptId] = useState("");
  const [faucetAccountId, setFaucetAccountId] = useState("");
  const faucetAccount = accounts.find(({ id }) => id === faucetAccountId);
  const [loading, setLoading] = useState(false);
  const [transactionRequest, setTransactionRequest] =
    useState<WasmTransactionRequestType | null>(
      createTransactionDialogTransactionRequest
    );
  const [transactionResult, setTransactionResult] =
    useState<WasmTransactionResultType | null>(
      createTransactionDialogTransactionResult
    );
  const onClose = () => {
    setExecutingAccountId("");
    setTransactionType("consume");
    setStep("select");
    setTargetAccountId("");
    setIsPublic(true);
    setConsumableNotes([]);
    setNoteIds([]);
    setTransactionRequest(null);
    setTransactionResult(null);
    setFaucetAccountId("");
    closeCreateTransactionDialog();
  };
  useEffect(() => {
    setExecutingAccountId(createTransactionDialogAccountId);
    setTransactionType(createTransactionDialogTransactionType);
    setStep(createTransactionDialogStep);
    setTransactionRequest(createTransactionDialogTransactionRequest);
    setTransactionResult(createTransactionDialogTransactionResult);
    setConsumableNotes(createTransactionDialogConsumableNotes);
  }, [
    createTransactionDialogAccountId,
    createTransactionDialogTransactionType,
    createTransactionDialogStep,
    createTransactionDialogTransactionRequest,
    createTransactionDialogTransactionResult,
    createTransactionDialogConsumableNotes,
  ]);
  return (
    <Dialog
      open={createTransactionDialogOpen}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="sm:max-w-160 z-100"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {step === "select" && "Create new transaction"}
            {step === "configure" && `Configure ${transactionType} transaction`}
            {step === "preview" && `Preview ${transactionType} transaction`}
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "Create a new transaction."}
            {step === "configure" &&
              `Configure ${transactionType} transaction parameters.`}
            {step === "preview" &&
              `Preview the outcome of this ${transactionType} transaction.`}
          </DialogDescription>
        </DialogHeader>
        {step === "select" && (
          <CreateTransactionSelectForm
            executingAccountId={executingAccountId}
            setExecutingAccountId={setExecutingAccountId}
            transactionType={transactionType}
            setTransactionType={setTransactionType}
            setLoading={setLoading}
            setConsumableNotes={setConsumableNotes}
            setStep={setStep}
          />
        )}
        {step === "configure" && (
          <CreateTransactionConfigureForm
            transactionType={transactionType}
            targetAccountId={targetAccountId}
            setTargetAccountId={setTargetAccountId}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
            noteIds={noteIds}
            setNoteIds={setNoteIds}
            scriptId={scriptId}
            setScriptId={setScriptId}
            consumableNotes={consumableNotes}
            executingAccountId={executingAccountId}
            faucetAccountId={faucetAccountId}
            setFaucetAccountId={setFaucetAccountId}
            setTransactionRequest={setTransactionRequest}
            setTransactionResult={setTransactionResult}
            setLoading={setLoading}
            setStep={setStep}
          />
        )}
        {step === "preview" && transactionRequest && transactionResult && (
          <CreateTransactionPreviewForm
            executingAccountId={executingAccountId}
            transactionRequest={transactionRequest}
            transactionResult={transactionResult}
            setLoading={setLoading}
            onClose={onClose}
          />
        )}
        <DialogFooter>
          <div className="flex w-full justify-between">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            {step === "select" && (
              <Button
                form="create-transaction-select-form"
                type="submit"
                disabled={!executingAccount}
              >
                Next
              </Button>
            )}
            {step === "configure" && (
              <div className="flex gap-2">
                {createTransactionDialogAccountId === "" && (
                  <Button variant="outline" onClick={() => setStep("select")}>
                    Back
                  </Button>
                )}
                <Button
                  form="create-transaction-configure-form"
                  type="submit"
                  disabled={
                    (transactionType === "mint" && !targetAccount) ||
                    (transactionType === "consume" && noteIds.length === 0) ||
                    (transactionType === "send" &&
                      (!targetAccount || !faucetAccount)) ||
                    (transactionType === "custom" && !scriptId) ||
                    loading
                  }
                >
                  {loading && <Spinner />}
                  {loading ? "Previewing…" : "Preview"}
                </Button>
              </div>
            )}
            {step === "preview" && (
              <div className="flex gap-2">
                {createTransactionDialogTransactionResult === null && (
                  <Button
                    variant="outline"
                    onClick={() => setStep("configure")}
                  >
                    Back
                  </Button>
                )}
                <Button
                  form="create-transaction-preview-form"
                  type="submit"
                  disabled={loading}
                >
                  {loading && <Spinner />}
                  {loading ? "Submitting…" : "Submit"}
                </Button>
              </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTransactionDialog;
