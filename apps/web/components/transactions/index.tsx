"use client";
import { useIsClient } from "usehooks-ts";
import { columns } from "@/components/transactions/columns";
import TransactionsTable from "@/components/transactions/transactions-table";
import CreateTransactionDialog from "@/components/transactions/create-transaction-dialog";
import useGlobalContext from "@/components/global-context/hook";
import { transactionToTableTransaction } from "@/lib/types";
import useTransactions from "@/hooks/use-transactions";

const Transactions = () => {
  const { networkId } = useGlobalContext();
  const { transactions } = useTransactions();
  const isClient = useIsClient();
  if (!isClient) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <TransactionsTable
        columns={columns}
        data={transactions.map((transaction) =>
          transactionToTableTransaction(transaction, networkId),
        )}
      />
      <CreateTransactionDialog />
    </div>
  );
};

export default Transactions;
