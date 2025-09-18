import { Plus } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import useTransactions from "@/hooks/use-transactions";
import { type TransactionType } from "@/lib/types/transaction";

const CreateTransactionButton = ({
  accountId = "",
  transactionType = "consume",
}: {
  accountId?: string;
  transactionType?: TransactionType;
}) => {
  const { openCreateTransactionDialog } = useTransactions();
  return (
    <Button
      variant="outline"
      onClick={() =>
        openCreateTransactionDialog({
          accountId,
          transactionType,
          step: "select",
        })
      }
    >
      <Plus />
      <span className="hidden lg:inline">Create new transaction</span>
    </Button>
  );
};

export default CreateTransactionButton;
