import { useState } from "react";
import { FileInput, RotateCw } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import useTransactions from "@/hooks/use-transactions";
import { type InputNote, noteInputsToAccountId } from "@/lib/types/note";
import useAccounts from "@/hooks/use-accounts";
import useGlobalContext from "@/components/global-context/hook";
import {
  useWallet,
  ConsumeTransaction,
  type MidenWalletAdapter,
} from "@demox-labs/miden-wallet-adapter";

const ConsumeNoteButton = ({ inputNote }: { inputNote: InputNote }) => {
  const { networkId } = useGlobalContext();
  const { wallet } = useWallet();
  const { accounts } = useAccounts();
  const { openCreateTransactionDialog, newConsumeTransactionRequest } =
    useTransactions();
  const [loading, setLoading] = useState(false);
  const targetAccountId = noteInputsToAccountId(inputNote.inputs);
  const targetAccount = accounts.find(({ id }) => id === targetAccountId);
  return (
    <Button
      variant="outline"
      onClick={async () => {
        if (networkId === "mlcl") {
          setLoading(true);
          const transactionResult = await newConsumeTransactionRequest({
            accountId: targetAccountId,
            noteIds: [inputNote.id],
          });
          setLoading(false);
          openCreateTransactionDialog({
            accountId: targetAccountId,
            transactionType: "consume",
            step: "preview",
            transactionResult,
          });
        } else {
          const [fungibleAsset] = inputNote.fungibleAssets;
          if (!wallet || !fungibleAsset) {
            return;
          }
          const transaction = new ConsumeTransaction(
            inputNote.senderId,
            inputNote.id,
            inputNote.type === "public" ? "public" : "private",
            Number(fungibleAsset.amount)
          );
          const adapter = wallet.adapter as MidenWalletAdapter;
          const txId = await adapter.requestConsume(transaction);
          console.log({ txId });
        }
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
