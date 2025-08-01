"use client";
import { useIsClient } from "usehooks-ts";
import useTransactions from "@/hooks/use-transactions";
import TransactionInformation from "@/components/transaction/transaction-information";

const Transaction = ({ id }: { id: string }) => {
  const isClient = useIsClient();
  const { transactions } = useTransactions();
  const transaction = transactions.find((transaction) => transaction.id === id);
  if (!isClient || !transaction) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <TransactionInformation transaction={transaction} />
    </div>
  );
};

export default Transaction;
