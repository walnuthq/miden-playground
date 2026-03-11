"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useIsClient } from "usehooks-ts";
import useAccounts from "@/hooks/use-accounts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { type Script } from "@/lib/types/script";
import AccountInformation from "@/components/account/account-information";
import AccountMultisig from "@/components/account/account-multisig";
import AccountComponents from "@/components/account/account-components";
import CreateTransactionDialog from "@/components/transactions/create-transaction-dialog";
import CreateTransactionDropdownMenu from "@/components/account/create-transaction-dropdown-menu";
import InvokeProcedureArgumentsDialog from "@/components/account/invoke-procedure-arguments-dialog";
import VerifyAccountComponentDialog from "@/components/account/verify-account-component-dialog";
import useGlobalContext from "@/components/global-context/hook";
import useMultisig from "@/hooks/use-multisig";

const Account = ({
  identifier,
  verifiedAccountComponents,
}: {
  identifier: string;
  verifiedAccountComponents: Script[];
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { networkId } = useGlobalContext();
  const isClient = useIsClient();
  const { accounts, connectedWallet } = useAccounts();
  const { isMultisigSigner } = useMultisig();
  const account = accounts.find((account) => account.identifier === identifier);
  if (!isClient || !account) {
    return null;
  }
  const showCreateTransactionButton =
    networkId === "mmck" ||
    connectedWallet?.address === account.address ||
    isMultisigSigner(account);
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Tabs
        defaultValue={searchParams.get("tab") ?? "information"}
        onValueChange={(value) =>
          router.push(
            value === "information"
              ? pathname
              : `${pathname}?${new URLSearchParams({ tab: value })}`,
          )
        }
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="information">Information</TabsTrigger>
            {account.multisig && (
              <TabsTrigger value="multisig">Multisig</TabsTrigger>
            )}
            <TabsTrigger value="components">Components</TabsTrigger>
          </TabsList>
          {showCreateTransactionButton && (
            <CreateTransactionDropdownMenu account={account} />
          )}
        </div>
        <TabsContent value="information">
          <AccountInformation account={account} />
        </TabsContent>
        {account.multisig && (
          <TabsContent value="multisig">
            <AccountMultisig account={account} />
          </TabsContent>
        )}
        <TabsContent value="components">
          <AccountComponents
            account={account}
            verifiedAccountComponents={verifiedAccountComponents}
          />
        </TabsContent>
      </Tabs>
      <CreateTransactionDialog />
      <InvokeProcedureArgumentsDialog />
      <VerifyAccountComponentDialog />
    </div>
  );
};

export default Account;
