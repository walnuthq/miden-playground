import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import useTransactions from "@/hooks/use-transactions";
import { type Account } from "@/lib/types";

const CreateTransactionDropdownMenu = ({ account }: { account: Account }) => {
  const { openCreateTransactionDialog } = useTransactions();
  const accountId = account.id;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Plus />
          <span className="hidden lg:inline">Create new transaction</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {account.account.isFaucet() ? (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreateTransactionDropdownMenu;
