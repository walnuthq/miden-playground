import { type Dispatch, type SetStateAction } from "react";
import { type ConsumableNoteRecord as WasmConsumableNoteRecordType } from "@demox-labs/miden-sdk";
import {
  type CreateTransactionDialogStep,
  type TransactionType,
} from "@/lib/types/transaction";
import { Label } from "@workspace/ui/components/label";
import { clientGetConsumableNotes } from "@/lib/web-client";
import SelectAccountDropdownMenu from "@/components/transactions/select-account-dropdown-menu";
import SelectTransactionTypeDropdownMenu from "@/components/transactions/select-transaction-type-dropdown-menu";
import useAccounts from "@/hooks/use-accounts";
import useMidenSdk from "@/hooks/use-miden-sdk";
import useWebClient from "@/hooks/use-web-client";
import useGlobalContext from "@/components/global-context/hook";

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
  const { midenSdk } = useMidenSdk();
  const { client } = useWebClient();
  const { networkId } = useGlobalContext();
  const { accounts } = useAccounts();
  const executingAccount = accounts.find(({ id }) => id === executingAccountId);
  return (
    <form
      id="create-transaction-select-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (transactionType === "consume" && executingAccount) {
          setLoading(true);
          const consumableNotes = await clientGetConsumableNotes({
            client,
            accountId: executingAccount.id,
            midenSdk,
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
            withoutFaucets={networkId !== "mlcl"}
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
