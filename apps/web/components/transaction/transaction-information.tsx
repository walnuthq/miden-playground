import { type Transaction, transactionToTableTransaction } from "@/lib/types";
import useGlobalContext from "@/components/global-context/hook";
import TransactionInformationTable from "@/components/transaction/transaction-information-table";

const TransactionInformation = ({
  transaction,
}: {
  transaction: Transaction;
}) => {
  const { networkId } = useGlobalContext();
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Transaction Information
        </h4>
        <TransactionInformationTable
          transaction={transactionToTableTransaction(transaction, networkId)}
        />
      </div>
    </div>
  );
};

export default TransactionInformation;
