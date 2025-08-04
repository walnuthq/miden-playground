"use client";
import { useEffect } from "react";
import { useIsClient } from "usehooks-ts";
import { columns } from "@/components/accounts/columns";
import AccountsTable from "@/components/accounts/accounts-table";
import CreateWalletDialog from "@/components/accounts/create-wallet-dialog";
import CreateFaucetDialog from "@/components/accounts/create-faucet-dialog";
import useAccounts from "@/hooks/use-accounts";
import CreateTransactionDialog from "@/components/transactions/create-transaction-dialog";
import { useWallet } from "@demox-labs/miden-wallet-adapter-react";
import { importAccountByAddress } from "@/lib/web-client";
import { AccountId } from "@workspace/mock-web-client";

const Accounts = () => {
  const { publicKey } = useWallet();
  const { accounts, importAccount } = useAccounts();
  const isClient = useIsClient();
  useEffect(() => {
    const importAccountByPublicKey = async (address: string) => {
      const account = await importAccountByAddress(address);
      await importAccount(account);
    };
    if (publicKey) {
      const localAccount = accounts.find(
        ({ id }) => id === AccountId.fromBech32(publicKey).toString()
      );
      if (!localAccount) {
        importAccountByPublicKey(publicKey);
      }
    }
  }, [publicKey]);
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
