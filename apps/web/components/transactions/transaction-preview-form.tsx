import type {
  TransactionRecord as WasmTransactionRecordType,
  TransactionRequest as WasmTransactionRequestType,
  TransactionResult as WasmTransactionResultType,
} from "@miden-sdk/miden-sdk";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import NoteId from "@/components/lib/note-id";
import TransactionEffects from "@/components/lib/transaction-effects";
import TransactionId from "@/components/lib/transaction-id";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";

export const SubmitTransactionToastDescription = ({
  transactionRecord,
}: {
  transactionRecord: WasmTransactionRecordType;
}) => (
  <>
    <p>
      Transaction ID:{" "}
      <TransactionId transactionId={transactionRecord.id().toHex()} />
    </p>
    {transactionRecord.outputNotes().numNotes() > 0 && (
      <>
        <p>Output notes:</p>
        <ul className="ml-6 list-disc [&>li]:mt-2">
          {transactionRecord
            .outputNotes()
            .notes()
            .map((note) => (
              <li key={note.id().toString()}>
                <NoteId noteId={note.id().toString()} />
              </li>
            ))}
        </ul>
      </>
    )}
  </>
);

// A transaction's preview: its effects against the account in app state, in a
// form whose submit submits it (executing it again). Shared by the Create
// Transaction and Invoke Procedure dialogs, whose Submit button targets
// `formId` and whose `onSubmitted` shows their own toast.
const TransactionPreviewForm = ({
  formId,
  executingAccountId,
  transactionRequest,
  transactionResult,
  setLoading,
  onSubmitted,
}: {
  formId: string;
  executingAccountId: string;
  transactionRequest: WasmTransactionRequestType;
  transactionResult: WasmTransactionResultType;
  setLoading: Dispatch<SetStateAction<boolean>>;
  onSubmitted: (transactionRecord: WasmTransactionRecordType) => void;
}) => {
  const { submitNewTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const executedTransaction = transactionResult.executedTransaction();
  const accountId = executedTransaction.accountId().toString();
  return (
    <form
      id={formId}
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
          const transactionRecord = await submitNewTransaction({
            accountId: executingAccountId,
            transactionRequest,
            transactionResult,
          });
          onSubmitted(transactionRecord);
        } catch (error) {
          console.error(error);
          toast.error("Transaction failed.", {
            description: error instanceof Error ? error.message : String(error),
          });
        } finally {
          setLoading(false);
        }
      }}
    >
      <TransactionEffects
        executedTransaction={executedTransaction}
        baseline={accounts.find(({ id }) => id === accountId)}
      />
    </form>
  );
};

export default TransactionPreviewForm;
