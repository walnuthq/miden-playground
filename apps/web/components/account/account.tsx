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
import AccountComponents from "@/components/account/account-components";
import CreateTransactionDialog from "@/components/transactions/create-transaction-dialog";
import CreateTransactionDropdownMenu from "@/components/account/create-transaction-dropdown-menu";
import InvokeProcedureArgumentsDialog from "@/components/account/invoke-procedure-arguments-dialog";
import VerifyAccountComponentDialog from "@/components/account/verify-account-component-dialog";
import useGlobalContext from "@/components/global-context/hook";
import { getAddressPart } from "@/lib/utils";

const Account = ({
  addressPart,
  verifiedAccountComponents,
}: {
  addressPart: string;
  verifiedAccountComponents: Script[];
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { networkId } = useGlobalContext();
  const isClient = useIsClient();
  const { accounts, connectedWallet } = useAccounts();
  const account = accounts.find(
    (account) => getAddressPart(account.address) === addressPart
  );
  if (!isClient || !account) {
    return null;
  }
  const showCreateTransactionButton =
    networkId === "mlcl" || connectedWallet?.address === account.address;
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Tabs
        defaultValue={searchParams.get("tab") ?? "information"}
        onValueChange={(value) =>
          router.push(
            value === "information"
              ? pathname
              : `${pathname}?${new URLSearchParams({ tab: value })}`
          )
        }
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="information">Information</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
          </TabsList>
          {showCreateTransactionButton && (
            <CreateTransactionDropdownMenu account={account} />
          )}
        </div>
        <TabsContent value="information">
          <AccountInformation account={account} />
        </TabsContent>
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
