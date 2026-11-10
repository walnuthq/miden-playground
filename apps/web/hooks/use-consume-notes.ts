import {
  ConsumeTransaction,
  type MidenWalletAdapter,
  useWallet,
} from "@miden-sdk/miden-wallet-adapter";
import { useMiden } from "@miden-sdk/react";
import useAccounts from "@/hooks/use-accounts";
import useMultisig from "@/hooks/use-multisig";
import useParaTransaction from "@/hooks/use-para-transaction";
import useTransactions from "@/hooks/use-transactions";
import type { Account } from "@/lib/types/account";
import type { InputNote } from "@/lib/types/note";
import { fromBase64 } from "@/lib/utils";

const useConsumeNotes = () => {
  const { client } = useMiden();
  const { wallet } = useWallet();
  const { faucets, connectedWallet, isParaWallet } = useAccounts();
  const { consumeWithPara } = useParaTransaction();
  const { loadMultisig, createConsumeNotesProposal } = useMultisig();
  const { openCreateTransactionDialog, newConsumeTransactionRequest } =
    useTransactions();
  // Consumes a note with the account that can: Para and Bread Wallet sign for
  // their own account, a multisig gets a proposal, and an account the
  // Playground holds itself goes through the transaction dialog's preview.
  // Throws with a message for the user when it can't.
  const consumeNote = async ({
    account,
    inputNote,
  }: {
    account: Account;
    inputNote: InputNote;
  }) => {
    if (isParaWallet(account)) {
      await consumeWithPara({ noteIds: [inputNote.id] });
    } else if (connectedWallet?.id === account.id) {
      if (!client) {
        throw new Error("MidenClient not ready");
      }
      if (!wallet) {
        throw new Error("Bread Wallet isn't connected.");
      }
      const [fungibleAsset] = inputNote.fungibleAssets;
      if (!fungibleAsset) {
        throw new Error(
          "This note carries no asset: Bread Wallet can't consume it from the Playground.",
        );
      }
      const faucet = faucets.find(({ id }) => id === fungibleAsset.faucetId);
      if (!faucet) {
        throw new Error(
          "Import the note's faucet account first: its asset isn't known to this workspace.",
        );
      }
      const adapter = wallet.adapter as MidenWalletAdapter;
      if (inputNote.noteFileBytes) {
        await adapter.importPrivateNote(fromBase64(inputNote.noteFileBytes));
      } else {
        const transaction = new ConsumeTransaction(
          faucet.identifier,
          inputNote.id,
          inputNote.type === "public" ? "public" : "private",
          Number(fungibleAsset.amount),
        );
        const txId = await adapter.requestConsume(transaction);
        console.info({ txId });
      }
    } else if (account.multisig) {
      const multisig = await loadMultisig(account.id);
      if (!multisig) {
        throw new Error("Connect the wallet that signs for this multisig.");
      }
      await createConsumeNotesProposal({
        multisig,
        noteIds: [inputNote.id],
      });
    } else {
      const { transactionRequest, transactionResult } =
        await newConsumeTransactionRequest({
          accountId: account.id,
          noteIds: [inputNote.id],
        });
      openCreateTransactionDialog({
        accountId: account.id,
        transactionType: "consume",
        step: "preview",
        transactionRequest,
        transactionResult,
      });
    }
  };
  return { consumeNote };
};

export default useConsumeNotes;
