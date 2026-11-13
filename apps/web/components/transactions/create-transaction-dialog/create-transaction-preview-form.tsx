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

const CreateTransactionPreviewForm = ({
  executingAccountId,
  transactionRequest,
  transactionResult,
  setLoading,
  onClose,
}: {
  executingAccountId: string;
  transactionRequest: WasmTransactionRequestType;
  transactionResult: WasmTransactionResultType;
  setLoading: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
}) => {
  const { submitNewTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const executedTransaction = transactionResult.executedTransaction();
  const accountId = executedTransaction.accountId().toString();
  return (
    <form
      id="create-transaction-preview-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
          const transactionRecord = await submitNewTransaction({
            accountId: executingAccountId,
            transactionRequest,
            transactionResult,
          });
          toast("Successfully created transaction.", {
            description: (
              <SubmitTransactionToastDescription
                transactionRecord={transactionRecord}
              />
            ),
          });
          onClose();
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

export default CreateTransactionPreviewForm;
