import type { Dispatch, SetStateAction } from "react";
import type { ConsumableNoteRecord as WasmConsumableNoteRecordType } from "@miden-sdk/miden-sdk";
import type {
  CreateTransactionDialogStep,
  TransactionType,
} from "@/lib/types/transaction";
import { Label } from "@workspace/ui/components/label";
import SelectAccountDropdownMenu from "@/components/transactions/select-account-dropdown-menu";
import SelectTransactionTypeDropdownMenu from "@/components/transactions/select-transaction-type-dropdown-menu";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import { clientGetConsumableNotes } from "@/lib/web-client";
import { useMiden } from "@miden-sdk/react";

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
  setConsumableNotes: Dispatch<SetStateAction<WasmConsumableNoteRecordType[]>>;
  setStep: Dispatch<SetStateAction<CreateTransactionDialogStep>>;
}) => {
  const { networkId } = useNetwork();
  const { client } = useMiden();
  const { accounts } = useAccounts();
  const executingAccount = accounts.find(({ id }) => id === executingAccountId);
  return (
    <form
      id="create-transaction-select-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!client) {
          throw new Error("MidenClient not ready");
        }
        if (transactionType === "consume" && executingAccount) {
          setLoading(true);
          const consumableNotes = await clientGetConsumableNotes({
            client,
            accountId: executingAccountId,
          });
          setLoading(false);
          setConsumableNotes(consumableNotes);
        }
        setStep("configure");
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-3 col-span-2">
          <Label>Executing account</Label>
          <SelectAccountDropdownMenu
            value={executingAccountId}
            onValueChange={(value) => {
              setExecutingAccountId(value);
              const account = accounts.find(({ id }) => id === value);
              setTransactionType(
                account?.isFaucet
                  ? "mint"
                  : account?.components.includes("basic-wallet")
                    ? "consume"
                    : "custom",
              );
            }}
            withoutFaucets={networkId !== "mmck"}
          />
        </div>
        <div className="grid gap-3 col-span-2">
          <Label>Transaction type</Label>
          <SelectTransactionTypeDropdownMenu
            value={transactionType}
            onValueChange={setTransactionType}
            selectTypes={
              executingAccount?.isFaucet
                ? ["mint"]
                : executingAccount?.components.includes("basic-wallet")
                  ? ["consume", "send"]
                  : ["custom"]
            }
          />
        </div>
      </div>
    </form>
  );
};

export default CreateTransactionDialogSelectForm;
