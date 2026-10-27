import { useMiden } from "@miden-sdk/react";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Plus } from "lucide-react";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
import type { Account } from "@/lib/types/account";
import { clientGetConsumableNotes } from "@/lib/web-client";

const CreateTransactionDropdownMenu = ({ account }: { account: Account }) => {
  const { client } = useMiden();
  const { openCreateTransactionDialog } = useTransactions();
  const { isParaWallet } = useAccounts();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <Plus />
        <span className="hidden lg:inline">Create new transaction</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto">
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
            {account.components.includes("basic-wallet") && (
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
            )}
            {/* Custom transactions aren't supported for Para Wallet yet. */}
            {!isParaWallet(account) && (
              <DropdownMenuItem
                onClick={() =>
                  openCreateTransactionDialog({
                    accountId: account.id,
                    transactionType: "custom",
                    step: "configure",
                  })
                }
              >
                New custom transaction
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreateTransactionDropdownMenu;
