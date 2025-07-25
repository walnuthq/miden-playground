"use client";
import { type TableAccount } from "@/lib/types";
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
import useAccounts from "@/hooks/use-accounts";
import AccountAddress from "@/components/lib/account-address";

const AccountActionsCell = ({
  account: { id: accountId },
}: {
  account: TableAccount;
}) => {
  const { openCreateTransactionDialog } = useTransactions();
  const { accounts } = useAccounts();
  const account = accounts.find(({ id }) => id === accountId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {account?.account.isFaucet() ? (
          <DropdownMenuItem
            onClick={() =>
              openCreateTransactionDialog({
                accountId,
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
              onClick={() =>
                openCreateTransactionDialog({
                  accountId,
                  transactionType: "consume",
                  step: "configure",
                })
              }
            >
              New consume transaction
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                openCreateTransactionDialog({
                  accountId,
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

export const columns: ColumnDef<TableAccount>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "address",
    header: "ID",
    cell: ({ row }) => <AccountAddress address={row.original.address} />,
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "storageMode",
    header: "Storage mode",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.storageMode === "Public" ? "default" : "destructive"
        }
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
