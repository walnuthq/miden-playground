import { type Account } from "@/lib/types";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import useTransactions from "@/hooks/use-transactions";
import AccountNotesTable from "@/components/account/account-notes-table";

const ConsumableNotesCard = ({ account }: { account: Account }) => {
  const { openCreateTransactionDialog, newConsumeTransactionRequest } =
    useTransactions();
  return (
    <Card className="pb-0 gap-2">
      <CardHeader className="">
        <CardTitle>Consumable Notes</CardTitle>
        <CardDescription>
          This account has pending notes that can be consumed.
        </CardDescription>
        <CardAction>
          <Button
            variant="outline"
            onClick={async () => {
              const transactionResult = await newConsumeTransactionRequest({
                accountId: account.id,
                noteIds: account.consumableNoteIds,
              });
              openCreateTransactionDialog({
                accountId: account.id,
                transactionType: "consume",
                step: "preview",
                transactionResult,
              });
            }}
          >
            Consume all notes
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0 pt-4 rounded-b-md">
        <AccountNotesTable account={account} />
      </CardContent>
    </Card>
  );
};

export default ConsumableNotesCard;
