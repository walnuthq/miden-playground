import { useState, useEffect } from "react";
import { FileInput } from "lucide-react";
import { Spinner } from "@workspace/ui/components/spinner";
import { Button } from "@workspace/ui/components/button";
import useTransactions from "@/hooks/use-transactions";
import { type InputNote } from "@/lib/types/note";
import { type Account } from "@/lib/types/account";
import useAccounts from "@/hooks/use-accounts";
import {
  useWallet,
  ConsumeTransaction,
  type MidenWalletAdapter,
} from "@miden-sdk/miden-wallet-adapter";
import { clientExportInputNoteFile } from "@/lib/web-client";
import { useMiden } from "@miden-sdk/react";

const ConsumeNoteButton = ({
  inputNote,
  targetAccount,
}: {
  inputNote: InputNote;
  targetAccount: Account;
}) => {
  const { client } = useMiden();
  const { wallet } = useWallet();
  const { faucets, connectedWallet } = useAccounts();
  const {
    createTransactionDialogOpen,
    openCreateTransactionDialog,
    newConsumeTransactionRequest,
  } = useTransactions();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!createTransactionDialogOpen) {
      setLoading(false);
    }
  }, [createTransactionDialogOpen]);
  return (
    <Button
      variant="outline"
      onClick={async () => {
        if (connectedWallet?.id === targetAccount.id) {
          if (!client) {
            throw new Error("MidenClient not ready");
          }
          const [fungibleAsset] = inputNote.fungibleAssets;
          const faucet = faucets.find(
            ({ id }) => id === fungibleAsset?.faucetId,
          );
          if (!wallet || !fungibleAsset || !faucet) {
            return;
          }
          const noteFileBytes =
            inputNote.type === "public"
              ? undefined
              : await clientExportInputNoteFile({
                  client,
                  noteId: inputNote.id,
                });
          const transaction = new ConsumeTransaction(
            faucet.identifier,
            inputNote.id,
            inputNote.type === "public" ? "public" : "private",
            Number(fungibleAsset.amount),
            noteFileBytes,
          );
          const adapter = wallet.adapter as MidenWalletAdapter;
          const txId = await adapter.requestConsume(transaction);
          console.log({ txId });
        } else {
          setLoading(true);
          const { transactionRequest, transactionResult } =
            await newConsumeTransactionRequest({
              accountId: targetAccount.id,
              noteIds: [inputNote.id],
            });
          openCreateTransactionDialog({
            accountId: targetAccount.id,
            transactionType: "consume",
            step: "preview",
            transactionRequest,
            transactionResult,
          });
        }
      }}
      disabled={loading}
    >
      {loading ? <Spinner /> : <FileInput />}
      <span className="hidden lg:inline">
        {loading
          ? "Consuming note…"
          : `Consume note with ${targetAccount.name}`}
      </span>
    </Button>
  );
};

export default ConsumeNoteButton;
