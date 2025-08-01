import { useState } from "react";
import { FileInput, RotateCw } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import useTransactions from "@/hooks/use-transactions";
import { type InputNote, noteInputsToAccountId } from "@/lib/types";
import useAccounts from "@/hooks/use-accounts";

const ConsumeNoteButton = ({ inputNote }: { inputNote: InputNote }) => {
  const { accounts } = useAccounts();
  const { openCreateTransactionDialog, newConsumeTransactionRequest } =
    useTransactions();
  const [loading, setLoading] = useState(false);
  const targetAccountId = noteInputsToAccountId(inputNote.inputs);
  const targetAccount = accounts.find(
    ({ id }) => id === targetAccountId.toString()
  );
  return (
    <Button
      variant="outline"
      onClick={async () => {
        const accountId = targetAccountId.toString();
        setLoading(true);
        const transactionResult = await newConsumeTransactionRequest({
          accountId,
          noteIds: [inputNote.id],
        });
        setLoading(false);
        openCreateTransactionDialog({
          accountId,
          transactionType: "consume",
          step: "preview",
          transactionResult,
        });
      }}
      disabled={loading}
    >
      {loading ? <RotateCw className="animate-spin" /> : <FileInput />}
      <span className="hidden lg:inline">
        {loading
          ? "Consuming note…"
          : `Consume note with ${targetAccount?.name}`}
      </span>
    </Button>
  );
};

export default ConsumeNoteButton;
