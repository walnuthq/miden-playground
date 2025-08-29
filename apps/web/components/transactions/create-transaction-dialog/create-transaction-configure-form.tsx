import { type Dispatch, type SetStateAction } from "react";
import {
  type CreateTransactionDialogStep,
  type TransactionType,
} from "@/lib/types";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import {
  type ConsumableNoteRecord,
  NoteType,
  type TransactionResult,
} from "@workspace/mock-web-client";
import SelectAccountDropdownMenu from "@/components/transactions/select-account-dropdown-menu";
import useAccounts from "@/hooks/use-accounts";
import SelectConsumableNotesCombobox from "@/components/transactions/select-consumable-notes-combobox";
import useGlobalContext from "@/components/global-context/hook";
import useTransactions from "@/hooks/use-transactions";
import useTutorials from "@/hooks/use-tutorials";
import {
  useWallet,
  SendTransaction,
  type MidenWalletAdapter,
} from "@demox-labs/miden-wallet-adapter";

const CreateTransactionConfigureForm = ({
  transactionType,
  targetAccountId,
  setTargetAccountId,
  isPublic,
  setIsPublic,
  noteIds,
  setNoteIds,
  consumableNotes,
  executingAccountId,
  faucetAccountId,
  setFaucetAccountId,
  setTransactionResult,
  setLoading,
  setStep,
}: {
  transactionType: TransactionType;
  targetAccountId: string;
  setTargetAccountId: Dispatch<SetStateAction<string>>;
  isPublic: boolean;
  setIsPublic: Dispatch<SetStateAction<boolean>>;
  noteIds: string[];
  setNoteIds: Dispatch<SetStateAction<string[]>>;
  consumableNotes: ConsumableNoteRecord[];
  executingAccountId: string;
  faucetAccountId: string;
  setFaucetAccountId: Dispatch<SetStateAction<string>>;
  setTransactionResult: Dispatch<SetStateAction<TransactionResult | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setStep: Dispatch<SetStateAction<CreateTransactionDialogStep>>;
}) => {
  const { networkId } = useGlobalContext();
  const { wallet } = useWallet();
  const { accounts } = useAccounts();
  const {
    newMintTransactionRequest,
    newConsumeTransactionRequest,
    newSendTransactionRequest,
    closeCreateTransactionDialog,
  } = useTransactions();
  const { tutorialId } = useTutorials();
  const executingAccount = accounts.find(({ id }) => id === executingAccountId);
  const targetAccount = accounts.find(({ id }) => id === targetAccountId);
  const faucetAccount = accounts.find(({ id }) => id === faucetAccountId);
  return (
    <form
      id="create-transaction-configure-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setLoading(true);
        if (transactionType === "mint" && executingAccount && targetAccount) {
          const transactionResult = await newMintTransactionRequest({
            targetAccountId: targetAccount.id,
            faucetId: executingAccount.id,
            noteType: formData.getAll("is-public").includes("on")
              ? NoteType.Public
              : NoteType.Private,
            amount: BigInt(formData.get("amount")!.toString()),
          });
          setTransactionResult(transactionResult);
        }
        if (transactionType === "consume" && executingAccount) {
          const transactionResult = await newConsumeTransactionRequest({
            accountId: executingAccount.id,
            noteIds,
          });
          setTransactionResult(transactionResult);
        }
        if (
          transactionType === "send" &&
          executingAccount &&
          targetAccount &&
          faucetAccount
        ) {
          if (networkId === "mlcl") {
            const transactionResult = await newSendTransactionRequest({
              senderAccountId: executingAccount.id,
              targetAccountId: targetAccount.id,
              faucetId: faucetAccount.id,
              noteType: formData.getAll("is-public").includes("on")
                ? NoteType.Public
                : NoteType.Private,
              amount: BigInt(formData.get("amount")!.toString()),
            });
            setTransactionResult(transactionResult);
          } else {
            if (!wallet) {
              return;
            }
            const transaction = new SendTransaction(
              executingAccount.id,
              targetAccount.id,
              faucetAccount.id,
              formData.getAll("is-public").includes("on")
                ? "public"
                : "private",
              Number(formData.get("amount")!.toString()),
            );
            const adapter = wallet.adapter as MidenWalletAdapter;
            const txId = await adapter.requestSend(transaction);
            console.log({ txId });
            closeCreateTransactionDialog();
          }
        }
        setLoading(false);
        setStep("preview");
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        {transactionType === "mint" && (
          <>
            <div className="grid gap-3 col-span-2">
              <Label>Target account</Label>
              <SelectAccountDropdownMenu
                value={targetAccountId}
                onValueChange={setTargetAccountId}
                selectFaucets={false}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="1"
                defaultValue={tutorialId ? 1000 : 0}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="is-public">Note type</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="is-public"
                  name="is-public"
                  defaultChecked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked)}
                />
                <Label htmlFor="is-public">
                  {isPublic ? "Public" : "Private"}
                </Label>
              </div>
            </div>
          </>
        )}
        {transactionType === "consume" && (
          <div className="grid gap-3 col-span-2">
            <Label>Notes to consume</Label>
            <SelectConsumableNotesCombobox
              value={noteIds}
              onValueChange={setNoteIds}
              consumableNotes={consumableNotes}
            />
          </div>
        )}
        {transactionType === "send" && (
          <>
            <div className="grid gap-3 col-span-2">
              <Label>Target account</Label>
              <SelectAccountDropdownMenu
                value={targetAccountId}
                onValueChange={setTargetAccountId}
                selectFaucets={false}
                without={executingAccountId}
              />
            </div>
            <div className="grid gap-3 col-span-2">
              <Label>Asset</Label>
              <SelectAccountDropdownMenu
                value={faucetAccountId}
                onValueChange={setFaucetAccountId}
                selectWallets={false}
                showFaucetsAsAssets
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="1"
                defaultValue={1000}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="is-public">Note type</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="is-public"
                  name="is-public"
                  defaultChecked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked)}
                />
                <Label htmlFor="is-public">
                  {isPublic ? "Public" : "Private"}
                </Label>
              </div>
            </div>
          </>
        )}
      </div>
    </form>
  );
};

export default CreateTransactionConfigureForm;
