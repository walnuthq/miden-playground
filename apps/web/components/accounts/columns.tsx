import { useMiden } from "@miden-sdk/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { MoreVertical } from "lucide-react";
import AccountAddress from "@/components/lib/account-address";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import useTransactions from "@/hooks/use-transactions";
import useTutorials from "@/hooks/use-tutorials";
import { midenFaucetAddress } from "@/lib/constants";
import type { DataTableFeatures } from "@/lib/table";
import type { Account } from "@/lib/types/account";
import { clientGetConsumableNotes } from "@/lib/web-client";

const AccountActionsCell = ({ account }: { account: Account }) => {
  const { networkId } = useNetwork();
  const { client } = useMiden();
  const { isConnectedWallet, deleteAccount } = useAccounts();
  const { openCreateTransactionDialog } = useTransactions();
  const { isTutorial } = useTutorials();
  const showMint =
    (isTutorial || networkId === "mmck") &&
    account.isFaucet &&
    account.address !== midenFaucetAddress(networkId);
  const showConsumeSend =
    (isTutorial || networkId === "mmck" || isConnectedWallet(account)) &&
    !account.isFaucet;
  const showDeleteAccount =
    !isConnectedWallet(account) &&
    account.address !== midenFaucetAddress(networkId);
  if (!showMint && !showConsumeSend && !showDeleteAccount) {
    return null;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="size-8 p-0" />}
      >
        <span className="sr-only">Open menu</span>
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto" align="end">
        {showMint && (
          <DropdownMenuItem
            onClick={() =>
              openCreateTransactionDialog({
                accountId: account.id,
                transactionType: "mint",
                step: "configure",
              })
            }
          >
            New mint transaction
          </DropdownMenuItem>
        )}
        {showConsumeSend && (
          <>
            <DropdownMenuItem
              onClick={async () => {
                if (!client) {
                  return;
                }
                const consumableNotes = await clientGetConsumableNotes({
                  client,
                  accountId: account.id,
                });
                openCreateTransactionDialog({
                  accountId: account.id,
                  transactionType: "consume",
                  step: "configure",
                  consumableNotes,
                });
              }}
            >
              New consume transaction
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                openCreateTransactionDialog({
                  accountId: account.id,
                  transactionType: "send",
                  step: "configure",
                })
              }
            >
              New send transaction
            </DropdownMenuItem>
          </>
        )}
        {showDeleteAccount && (
          <DropdownMenuItem onClick={() => deleteAccount(account.id)}>
            Delete account
          </DropdownMenuItem>
        )}
        {/* <DropdownMenuItem onClick={() => {}}>
          New custom transaction
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Columns the table hides on phones (`mobileColumnClassName`).
// No copy button on a phone, where it pushes the row actions off-screen: the
// account's page has one.
const AccountAddressCell = ({ address }: { address: string }) => {
  const isMobile = useIsMobile();
  return (
    <AccountAddress
      address={address}
      withName={false}
      withCopyButton={!isMobile}
    />
  );
};

// On the narrowest phones (320 px), the name wraps and the ID gives way
// (clipped), so the row menu stays on screen: the account page has the full
// ID.
export const narrowColumnClassNames: Record<string, string> = {
  name: "max-sm:whitespace-normal",
  address: "max-sm:w-full max-sm:max-w-0 max-sm:overflow-hidden",
};

export const mobileHiddenColumns = ["storageMode", "nonce"];

export const columns: ColumnDef<DataTableFeatures, Account>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "address",
    header: "ID",
    cell: ({ row }) => <AccountAddressCell address={row.original.address} />,
  },
  {
    accessorKey: "storageMode",
    header: "Storage mode",
    cell: ({ row }) => (
      <Badge
        variant={row.original.isPublic ? "default" : "destructive"}
        className="capitalize"
      >
        {row.original.isPublic ? "Public" : "Private"}
      </Badge>
    ),
  },
  {
    accessorKey: "nonce",
    header: "Nonce",
  },
  {
    id: "actions",
    cell: ({ row }) => <AccountActionsCell account={row.original} />,
  },
];
