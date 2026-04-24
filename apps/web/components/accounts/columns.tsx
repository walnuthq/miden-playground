"use client";
import { MoreVertical } from "lucide-react";
import { useMiden } from "@miden-sdk/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { accountTypes, type Account } from "@/lib/types/account";
import useNetwork from "@/hooks/use-network";
import useTransactions from "@/hooks/use-transactions";
import AccountAddress from "@/components/lib/account-address";
import useAccounts from "@/hooks/use-accounts";
import useTutorials from "@/hooks/use-tutorials";
import { midenFaucetAddress } from "@/lib/constants";
import { clientGetConsumableNotes } from "@/lib/web-client";

const AccountActionsCell = ({ account }: { account: Account }) => {
  const { networkId } = useNetwork();
  const { client } = useMiden();
  const { connectedWallet, deleteAccount } = useAccounts();
  const { openCreateTransactionDialog } = useTransactions();
  const { isTutorial } = useTutorials();
  const showMint = (isTutorial || networkId === "mmck") && account.isFaucet;
  const showConsumeSend =
    (isTutorial ||
      networkId === "mmck" ||
      connectedWallet?.address === account.address) &&
    !account.isFaucet;
  const showDeleteAccount =
    account.address !== connectedWallet?.address &&
    account.address !== midenFaucetAddress(networkId);
  if (!showMint && !showConsumeSend && !showDeleteAccount) {
    return null;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
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

export const columns: ColumnDef<Account>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "address",
    header: "ID",
    cell: ({ row }) => (
      <AccountAddress address={row.original.address} withName={false} />
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => accountTypes[row.original.type],
  },
  {
    accessorKey: "storageMode",
    header: "Storage mode",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.storageMode === "public"
            ? "default"
            : row.original.storageMode === "network"
              ? "secondary"
              : "destructive"
        }
        className="capitalize"
      >
        {row.original.storageMode}
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
