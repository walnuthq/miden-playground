import { type Dispatch, type SetStateAction } from "react";
import {
  type CreateTransactionDialogStep,
  type TransactionType,
} from "@/lib/types/transaction";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import SelectAccountDropdownMenu from "@/components/transactions/select-account-dropdown-menu";
import useAccounts from "@/hooks/use-accounts";
import SelectConsumableNotesCombobox from "@/components/transactions/select-consumable-notes-combobox";
import useGlobalContext from "@/components/global-context/hook";
import useTransactions from "@/hooks/use-transactions";
import {
  type ConsumableNoteRecord as WasmConsumableNoteRecordType,
  type TransactionResult as WasmTransactionResultType,
  type TransactionRequest as WasmTransactionRequestType,
} from "@demox-labs/miden-sdk";
import {
  useWallet,
  SendTransaction,
  type MidenWalletAdapter,
} from "@demox-labs/miden-wallet-adapter";
import { formatAmount, parseAmount } from "@/lib/utils";
import useScripts from "@/hooks/use-scripts";
import { clientCreateTransactionFromScript } from "@/lib/web-client";
import useMidenSdk from "@/hooks/use-miden-sdk";

const CreateTransactionConfigureForm = ({
  transactionType,
  targetAccountId,
  setTargetAccountId,
  isPublic,
  setIsPublic,
  noteIds,
  setNoteIds,
  consumableNotes,
  scriptId,
  setScriptId,
  executingAccountId,
  faucetAccountId,
  setFaucetAccountId,
  setTransactionRequest,
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
  consumableNotes: WasmConsumableNoteRecordType[];
  scriptId: string;
  setScriptId: Dispatch<SetStateAction<string>>;
  executingAccountId: string;
  faucetAccountId: string;
  setFaucetAccountId: Dispatch<SetStateAction<string>>;
  setTransactionRequest: Dispatch<
    SetStateAction<WasmTransactionRequestType | null>
  >;
  setTransactionResult: Dispatch<
    SetStateAction<WasmTransactionResultType | null>
  >;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setStep: Dispatch<SetStateAction<CreateTransactionDialogStep>>;
}) => {
  const { midenSdk } = useMidenSdk();
  const { wallet } = useWallet();
  const { networkId } = useGlobalContext();
  const { accounts } = useAccounts();
  const { scripts } = useScripts();
  const {
    newMintTransactionRequest,
    newConsumeTransactionRequest,
    newSendTransactionRequest,
    newCustomTransactionRequest,
    closeCreateTransactionDialog,
  } = useTransactions();
  const executingAccount = accounts.find(({ id }) => id === executingAccountId);
  const targetAccount = accounts.find(({ id }) => id === targetAccountId);
  const faucetAccount = accounts.find(({ id }) => id === faucetAccountId);
  const decimals =
    transactionType === "mint"
      ? executingAccount?.decimals
      : faucetAccount?.decimals;
  const balance =
    executingAccount?.fungibleAssets.find(
      ({ faucetId }) => faucetId === faucetAccountId
    )?.amount ?? "0";
  const shownScripts = scripts.filter(
    ({ type, status }) => type === "transaction-script" && status === "compiled"
  );
  const script = scripts.find(({ id }) => id === scriptId);
  return (
    <form
      id="create-transaction-configure-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setLoading(true);
        if (transactionType === "mint" && executingAccount && targetAccount) {
          const { transactionRequest, transactionResult } =
            await newMintTransactionRequest({
              targetAccountId: targetAccount.id,
              faucetId: executingAccount.id,
              noteType: formData.getAll("is-public").includes("on")
                ? "public"
                : "private",
              amount: parseAmount(
                formData.get("amount")?.toString() ?? "0",
                decimals
              ),
            });
          setTransactionRequest(transactionRequest);
          setTransactionResult(transactionResult);
        }
        if (transactionType === "consume" && executingAccount) {
          const { transactionRequest, transactionResult } =
            await newConsumeTransactionRequest({
              accountId: executingAccount.id,
              noteIds,
            });
          setTransactionRequest(transactionRequest);
          setTransactionResult(transactionResult);
        }
        if (
          transactionType === "send" &&
          executingAccount &&
          targetAccount &&
          faucetAccount
        ) {
          if (networkId === "mlcl") {
            const { transactionRequest, transactionResult } =
              await newSendTransactionRequest({
                senderAccountId: executingAccount.id,
                targetAccountId: targetAccount.id,
                faucetId: faucetAccount.id,
                noteType: formData.getAll("is-public").includes("on")
                  ? "public"
                  : "private",
                amount: parseAmount(
                  formData.get("amount")?.toString() ?? "0",
                  decimals
                ),
              });
            setTransactionRequest(transactionRequest);
            setTransactionResult(transactionResult);
          } else {
            if (!wallet) {
              return;
            }
            const transaction = new SendTransaction(
              executingAccount.address,
              targetAccount.address,
              faucetAccount.address,
              formData.getAll("is-public").includes("on")
                ? "public"
                : "private",
              Number(
                parseAmount(formData.get("amount")?.toString() ?? "0", decimals)
              )
            );
            const adapter = wallet.adapter as MidenWalletAdapter;
            const txId = await adapter.requestSend(transaction);
            console.log({ txId });
            closeCreateTransactionDialog();
          }
        }
        if (transactionType === "custom" && executingAccount && script) {
          const customTransactionRequest = clientCreateTransactionFromScript({
            script,
            midenSdk,
          });
          const { transactionRequest, transactionResult } =
            await newCustomTransactionRequest({
              senderAccountId: executingAccount.id,
              transactionRequest: customTransactionRequest,
            });
          setTransactionRequest(transactionRequest);
          setTransactionResult(transactionResult);
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
                selectWallets
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step={formatAmount("1", decimals).replaceAll(",", "")}
                min={formatAmount("1", decimals).replaceAll(",", "")}
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
                selectWallets
                without={executingAccountId}
              />
            </div>
            <div className="grid gap-3 col-span-2">
              <Label>Asset</Label>
              <SelectAccountDropdownMenu
                value={faucetAccountId}
                onValueChange={setFaucetAccountId}
                selectFaucets
                showFaucetsAsAssets
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step={formatAmount("1", decimals).replaceAll(",", "")}
                min={formatAmount("1", decimals).replaceAll(",", "")}
                max={formatAmount(balance, decimals).replaceAll(",", "")}
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
        {transactionType === "custom" && (
          <div className="grid gap-3 col-span-2">
            <Label>Transaction script</Label>
            <Select onValueChange={setScriptId} value={scriptId}>
              <SelectTrigger
                className="w-45"
                disabled={shownScripts.length === 0}
              >
                <SelectValue placeholder="Select script…" />
              </SelectTrigger>
              <SelectContent>
                {shownScripts.map((script) => (
                  <SelectItem key={script.id} value={script.id}>
                    {script.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </form>
  );
};

export default CreateTransactionConfigureForm;
