import AccountsTable from "@/components/accounts/accounts-table";
import { columns } from "@/components/accounts/columns";
import CreateFaucetDialog from "@/components/accounts/create-faucet-dialog";
import CreateWalletDialog from "@/components/accounts/create-wallet-dialog";
import DeployAccountDialog from "@/components/accounts/deploy-account-dialog";
import DeployMultisigDialog from "@/components/accounts/deploy-multisig-dialog";
import ImportAccountDialog from "@/components/accounts/import-account-dialog";
import CreateTransactionDialog from "@/components/transactions/create-transaction-dialog";
import useAccounts from "@/hooks/use-accounts";

const Accounts = () => {
  const { accounts } = useAccounts();
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <AccountsTable columns={columns} data={accounts} />
      <CreateWalletDialog />
      <CreateFaucetDialog />
      <ImportAccountDialog />
      <DeployAccountDialog />
      <DeployMultisigDialog />
      <CreateTransactionDialog />
    </div>
  );
};

export default Accounts;
