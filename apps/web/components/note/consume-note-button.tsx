import { useState } from "react";
import { FileInput } from "lucide-react";
import { Spinner } from "@workspace/ui/components/spinner";
import { Button } from "@workspace/ui/components/button";
import useTransactions from "@/hooks/use-transactions";
import { accountIdFromPrefixSuffix } from "@/lib/types/account";
import { type InputNote } from "@/lib/types/note";
import useAccounts from "@/hooks/use-accounts";
import useGlobalContext from "@/components/global-context/hook";
import {
  useWallet,
  ConsumeTransaction,
  type MidenWalletAdapter,
} from "@demox-labs/miden-wallet-adapter";
import { clientExportInputNoteFile } from "@/lib/web-client";
import useWebClient from "@/hooks/use-web-client";
import useMidenSdk from "@/hooks/use-miden-sdk";

const ConsumeNoteButton = ({ inputNote }: { inputNote: InputNote }) => {
  const { midenSdk } = useMidenSdk();
  const { client } = useWebClient();
  const { wallet } = useWallet();
  const { networkId } = useGlobalContext();
  const { faucets, accounts } = useAccounts();
  const { openCreateTransactionDialog, newConsumeTransactionRequest } =
    useTransactions();
  const [loading, setLoading] = useState(false);
  const targetAccountId = accountIdFromPrefixSuffix(
    inputNote.inputs[1]!,
    inputNote.inputs[0]!,
  );
  const targetAccount = accounts.find(({ id }) => id === targetAccountId);
  return (
    <Button
      variant="outline"
      onClick={async () => {
        if (networkId === "mlcl") {
          setLoading(true);
          const { transactionRequest, transactionResult } =
            await newConsumeTransactionRequest({
              accountId: targetAccountId,
              noteIds: [inputNote.id],
            });
          setLoading(false);
          openCreateTransactionDialog({
            accountId: targetAccountId,
            transactionType: "consume",
            step: "preview",
            transactionRequest,
            transactionResult,
          });
        } else {
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
                  midenSdk,
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
        }
      }}
      disabled={loading}
    >
      {loading ? <Spinner /> : <FileInput />}
      <span className="hidden lg:inline">
        {loading
          ? "Consuming note…"
          : `Consume note with ${targetAccount?.name}`}
      </span>
    </Button>
  );
};

export default ConsumeNoteButton;
