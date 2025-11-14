import { type Dispatch, type SetStateAction } from "react";
import { type ConsumableNoteRecord as WasmConsumableNoteRecord } from "@demox-labs/miden-sdk";
import {
  type CreateTransactionDialogStep,
  type TransactionType,
} from "@/lib/types/transaction";
import { Label } from "@workspace/ui/components/label";
import { webClient, clientGetConsumableNotes } from "@/lib/web-client";
import SelectAccountDropdownMenu from "@/components/transactions/select-account-dropdown-menu";
import SelectTransactionTypeDropdownMenu from "@/components/transactions/select-transaction-type-dropdown-menu";
import useAccounts from "@/hooks/use-accounts";
import useGlobalContext from "@/components/global-context/hook";
import useTransactions from "@/hooks/use-transactions";

const CreateTransactionDialogSelectForm = ({
  executingAccountId,
  setExecutingAccountId,
  transactionType,
  setTransactionType,
  setLoading,
  setConsumableNotes,
  setStep,
}: {
  executingAccountId: string;
  setExecutingAccountId: Dispatch<SetStateAction<string>>;
  transactionType: TransactionType;
  setTransactionType: Dispatch<SetStateAction<TransactionType>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setConsumableNotes: Dispatch<SetStateAction<WasmConsumableNoteRecord[]>>;
  setStep: Dispatch<SetStateAction<CreateTransactionDialogStep>>;
}) => {
  const { networkId, serializedMockChain } = useGlobalContext();
  const { createTransactionDialogAccountId } = useTransactions();
  const { accounts } = useAccounts();
  const executingAccount = accounts.find(({ id }) => id === executingAccountId);
  return (
    <form
      id="create-transaction-select-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (transactionType === "consume" && executingAccount) {
          setLoading(true);
          const client = await webClient(networkId, serializedMockChain);
          const consumableNotes = await clientGetConsumableNotes(
            client,
            executingAccount.id
          );
          setLoading(false);
          setConsumableNotes(consumableNotes);
        }
        setStep("configure");
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        {!createTransactionDialogAccountId && (
          <div className="grid gap-3 col-span-2">
            <Label>Executing account</Label>
            <SelectAccountDropdownMenu
              value={executingAccountId}
              onValueChange={(value) => {
                setExecutingAccountId(value);
                const account = accounts.find(({ id }) => id === value);
                setTransactionType(account?.isFaucet ? "mint" : "consume");
              }}
            />
          </div>
        )}
        <div className="grid gap-3 col-span-2">
          <Label>Transaction type</Label>
          <SelectTransactionTypeDropdownMenu
            value={transactionType}
            onValueChange={setTransactionType}
            selectTypes={
              executingAccount?.isFaucet
                ? ["mint", "consume"]
                : ["consume", "send"]
            }
          />
        </div>
      </div>
    </form>
  );
};

export default CreateTransactionDialogSelectForm;
