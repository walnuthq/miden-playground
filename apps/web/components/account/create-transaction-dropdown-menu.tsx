import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import useTransactions from "@/hooks/use-transactions";
import { type Account } from "@/lib/types/account";
import { useMiden } from "@miden-sdk/react";
import { clientGetConsumableNotes } from "@/lib/web-client";

const CreateTransactionDropdownMenu = ({ account }: { account: Account }) => {
  const { client } = useMiden();
  const { openCreateTransactionDialog } = useTransactions();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Plus />
          <span className="hidden lg:inline">Create new transaction</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreateTransactionDropdownMenu;
