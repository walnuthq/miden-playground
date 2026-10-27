import type { TransactionRequest as WasmTransactionRequestType } from "@miden-sdk/miden-sdk";
import { toast } from "sonner";
import { SubmitTransactionToastDescription } from "@/components/transactions/create-transaction-dialog/create-transaction-preview-form";
import useTransactions from "@/hooks/use-transactions";
import type { NoteType } from "@/lib/types/note";

// Para's sign callback rejects with this when its confirmation modal is
// dismissed (@miden-sdk/para signCb).
const PARA_SIGNING_CANCELLED = "User cancelled signing";
// The node rejects a transaction submitted after its expiration block. Moving
// assets with a transfer policy, such as USDCx, caps it at 20 blocks (about a
// minute) after the reference block, so a slow approval in Para's modal
// expires the transaction.
const TRANSACTION_EXPIRED = "transaction expired";
// Error toasts stay until dismissed, so a retry clears the previous one.
const ERROR_TOAST_ID = "para-transaction-error";

// Submits Para Wallet transactions (see submitParaTransaction) and reports the
// outcome. Para's signing modal, which shows the transaction summary, is the
// confirmation step, so these skip the dialog's preview.
const useParaTransaction = () => {
  const { submitParaTransaction } = useTransactions();
  const runWithPara = async (
    run: Parameters<typeof submitParaTransaction>[0],
  ) => {
    toast.dismiss(ERROR_TOAST_ID);
    try {
      const transactionRecord = await submitParaTransaction(run);
      toast("Successfully created transaction.", {
        description: (
          <SubmitTransactionToastDescription
            transactionRecord={transactionRecord}
          />
        ),
      });
      return transactionRecord;
    } catch (error) {
      // The executor may wrap the callback's error in its own message.
      if (String(error).includes(PARA_SIGNING_CANCELLED)) {
        toast("Transaction cancelled.");
      } else if (String(error).includes(TRANSACTION_EXPIRED)) {
        console.error("ERROR: submitParaTransaction", error);
        toast.error("Transaction expired.", {
          description:
            "It must be signed within about a minute. Try again and approve it in Para right away.",
          id: ERROR_TOAST_ID,
          duration: Infinity,
          closeButton: true,
        });
      } else {
        console.error("ERROR: submitParaTransaction", error);
        toast.error("Transaction failed.", {
          description: error instanceof Error ? error.message : String(error),
          id: ERROR_TOAST_ID,
          duration: Infinity,
          closeButton: true,
        });
      }
      return null;
    }
  };
  const submitWithPara = (transactionRequest: WasmTransactionRequestType) =>
    runWithPara((paraClient, accountId) =>
      paraClient.transactions.submit(accountId, transactionRequest),
    );
  const consumeWithPara = ({ noteIds }: { noteIds: string[] }) =>
    runWithPara((paraClient, accountId) =>
      paraClient.transactions.consume({ account: accountId, notes: noteIds }),
    );
  const sendWithPara = ({
    targetAccountId,
    faucetId,
    noteType,
    amount,
  }: {
    targetAccountId: string;
    faucetId: string;
    noteType: NoteType;
    amount: bigint;
  }) =>
    runWithPara((paraClient, accountId) =>
      paraClient.transactions.send({
        account: accountId,
        to: targetAccountId,
        token: faucetId,
        amount,
        type: noteType,
      }),
    );
  return { submitWithPara, consumeWithPara, sendWithPara };
};

export default useParaTransaction;
