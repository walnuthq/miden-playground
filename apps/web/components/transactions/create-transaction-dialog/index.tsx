import { useState, useEffect } from "react";
import { RotateCw } from "lucide-react";
import {
  type ConsumableNoteRecord,
  type TransactionResult,
} from "@workspace/mock-web-client";
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
    ConsumableNoteRecord[]
  >(createTransactionDialogConsumableNotes);
  const [noteIds, setNoteIds] = useState<string[]>(
    createTransactionDialogNoteIds
  );
  const [faucetAccountId, setFaucetAccountId] = useState("");
  const faucetAccount = accounts.find(({ id }) => id === faucetAccountId);
  const [loading, setLoading] = useState(false);
  const [transactionResult, setTransactionResult] =
    useState<TransactionResult | null>(
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
    setTransactionResult(null);
    setFaucetAccountId("");
    closeCreateTransactionDialog();
  };
  useEffect(() => {
    setExecutingAccountId(createTransactionDialogAccountId);
    setTransactionType(createTransactionDialogTransactionType);
    setStep(createTransactionDialogStep);
    setTransactionResult(createTransactionDialogTransactionResult);
    //setConsumableNotes(createTransactionDialogConsumableNotes);
    //setNoteIds(createTransactionDialogNoteIds);
  }, [
    createTransactionDialogAccountId,
    createTransactionDialogTransactionType,
    createTransactionDialogStep,
    createTransactionDialogTransactionResult,
  ]);
  return (
    <Dialog
      open={createTransactionDialogOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-[640px] z-100">
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
            consumableNotes={consumableNotes}
            executingAccountId={executingAccountId}
            faucetAccountId={faucetAccountId}
            setFaucetAccountId={setFaucetAccountId}
            setTransactionResult={setTransactionResult}
            setLoading={setLoading}
            setStep={setStep}
          />
        )}
        {step === "preview" && transactionResult && (
          <CreateTransactionPreviewForm
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
                    loading
                  }
                >
                  {loading && <RotateCw className="animate-spin" />}
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
                  {loading && <RotateCw className="animate-spin" />}
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
