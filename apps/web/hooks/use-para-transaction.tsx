import { toast } from "sonner";
import type { TransactionRequest as WasmTransactionRequestType } from "@miden-sdk/miden-sdk/lazy";
import useTransactions from "@/hooks/use-transactions";
import type { NoteType } from "@/lib/types/note";
import { SubmitTransactionToastDescription } from "@/components/transactions/create-transaction-dialog/create-transaction-preview-form";

// Para's sign callback rejects with this when its confirmation modal is
// dismissed (@miden-sdk/para signCb).
const PARA_SIGNING_CANCELLED = "User cancelled signing";

// Submits Para Wallet transactions (see submitParaTransaction) and reports the
// outcome. Para's signing modal, which shows the transaction summary, is the
// confirmation step, so these skip the dialog's preview.
const useParaTransaction = () => {
  const { submitParaTransaction } = useTransactions();
  const runWithPara = async (
    run: Parameters<typeof submitParaTransaction>[0],
  ) => {
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
      } else {
        console.error("ERROR: submitParaTransaction", error);
        toast.error("Transaction failed.", {
          description: error instanceof Error ? error.message : String(error),
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
