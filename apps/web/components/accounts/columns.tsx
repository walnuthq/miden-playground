"use client";
import { accountTypes, type Account } from "@/lib/types/account";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreVertical } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import useTransactions from "@/hooks/use-transactions";
import AccountAddress from "@/components/lib/account-address";
import { clientGetConsumableNotes } from "@/lib/web-client";
import useGlobalContext from "@/components/global-context/hook";
import useAccounts from "@/hooks/use-accounts";
import useMidenSdk from "@/hooks/use-miden-sdk";
import useWebClient from "@/hooks/use-web-client";

const AccountActionsCell = ({ account }: { account: Account }) => {
  const { midenSdk } = useMidenSdk();
  const { networkId } = useGlobalContext();
  const { client } = useWebClient();
  const { connectedWallet } = useAccounts();
  const { openCreateTransactionDialog } = useTransactions();
  if (networkId !== "mmck" && connectedWallet?.address !== account.address) {
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
        {account.isFaucet ? (
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
        ) : (
          <>
            <DropdownMenuItem
              onClick={async () => {
                const consumableNotes = await clientGetConsumableNotes({
                  client,
                  accountId: account.id,
                  midenSdk,
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
