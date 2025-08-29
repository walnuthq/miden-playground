"use client";
import { useEffect } from "react";
import { useIsClient } from "usehooks-ts";
import { columns } from "@/components/accounts/columns";
import AccountsTable from "@/components/accounts/accounts-table";
import CreateWalletDialog from "@/components/accounts/create-wallet-dialog";
import CreateFaucetDialog from "@/components/accounts/create-faucet-dialog";
import ImportAccountDialog from "@/components/accounts/import-account-dialog";
import useAccounts from "@/hooks/use-accounts";
import CreateTransactionDialog from "@/components/transactions/create-transaction-dialog";
import { useWallet } from "@demox-labs/miden-wallet-adapter";
import useGlobalContext from "@/components/global-context/hook";

const Accounts = () => {
  const { accountId } = useWallet();
  const { networkId } = useGlobalContext();
  const { accounts, wallets, importConnectedWallet } = useAccounts();
  const isClient = useIsClient();
  // TODO refactor using onConnect callback?
  useEffect(() => {
    if (accountId && networkId === "mtst") {
      const connectedWallet = wallets.find(
        ({ address }) => address === accountId,
      );
      if (!connectedWallet) {
        importConnectedWallet(accountId);
      }
    }
  }, [accountId, networkId, wallets.length]);
  if (!isClient) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {isClient && <AccountsTable columns={columns} data={accounts} />}
      <CreateWalletDialog />
      <CreateFaucetDialog />
      <ImportAccountDialog />
      <CreateTransactionDialog />
    </div>
  );
};

export default Accounts;
