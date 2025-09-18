"use client";
import { useIsClient } from "usehooks-ts";
import { columns } from "@/components/transactions/columns";
import TransactionsTable from "@/components/transactions/transactions-table";
import CreateTransactionDialog from "@/components/transactions/create-transaction-dialog";
import useTransactions from "@/hooks/use-transactions";

const Transactions = () => {
  const { transactions } = useTransactions();
  const isClient = useIsClient();
  if (!isClient) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <TransactionsTable columns={columns} data={transactions} />
      <CreateTransactionDialog />
    </div>
  );
};

export default Transactions;
