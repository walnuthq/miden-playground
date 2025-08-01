import { type Transaction } from "@/lib/types";
import TransactionInformationTable from "@/components/transaction/transaction-information-table";
import TransactionNoteTable from "@/components/transaction/transaction-note-table";

const TransactionInformation = ({
  transaction,
}: {
  transaction: Transaction;
}) => (
  <div className="flex flex-col gap-8">
    <div className="flex flex-col gap-2">
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
        Transaction Information
      </h4>
      <TransactionInformationTable transaction={transaction} />
    </div>
    {transaction.inputNotes.length > 0 && (
      <div className="flex flex-col gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Transaction Input Notes
        </h4>
        <TransactionNoteTable notes={transaction.inputNotes} />
      </div>
    )}
    {transaction.outputNotes.length > 0 && (
      <div className="flex flex-col gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Transaction Output Notes
        </h4>
        <TransactionNoteTable notes={transaction.outputNotes} />
      </div>
    )}
  </div>
);

export default TransactionInformation;
