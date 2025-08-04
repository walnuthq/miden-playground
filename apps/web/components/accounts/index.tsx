"use client";
import { useIsClient } from "usehooks-ts";
import { columns } from "@/components/accounts/columns";
import AccountsTable from "@/components/accounts/accounts-table";
import CreateWalletDialog from "@/components/accounts/create-wallet-dialog";
import CreateFaucetDialog from "@/components/accounts/create-faucet-dialog";
import useAccounts from "@/hooks/use-accounts";
import CreateTransactionDialog from "@/components/transactions/create-transaction-dialog";

const Accounts = () => {
  const { accounts } = useAccounts();
  const isClient = useIsClient();
  if (!isClient) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {isClient && <AccountsTable columns={columns} data={accounts} />}
      <CreateWalletDialog />
      <CreateFaucetDialog />
      <CreateTransactionDialog />
    </div>
  );
};

export default Accounts;
