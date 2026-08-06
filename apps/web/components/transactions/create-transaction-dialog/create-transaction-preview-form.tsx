import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import useTransactions from "@/hooks/use-transactions";
import FungibleAssetsTable from "@/components/lib/fungible-assets-table";
import AccountAddress from "@/components/lib/account-address";
import AccountStorageDeltaTable from "@/components/lib/account-storage-delta-table";
import TransactionId from "@/components/lib/transaction-id";
import NoteId from "@/components/lib/note-id";
import type {
  TransactionResult as WasmTransactionResultType,
  TransactionRequest as WasmTransactionRequestType,
  TransactionRecord as WasmTransactionRecordType,
} from "@miden-sdk/miden-sdk/lazy";
import { FungibleAsset as WasmFungibleAsset } from "@miden-sdk/miden-sdk/lazy";
import useAccounts from "@/hooks/use-accounts";
import { defaultStorageItem } from "@/lib/utils/account";

const SubmitTransactionToastDescription = ({
  transactionRecord,
}: {
  transactionRecord: WasmTransactionRecordType;
}) => (
  <>
    <p>
      Transaction ID:{" "}
      <TransactionId transactionId={transactionRecord.id().toHex()} />
    </p>
    {transactionRecord.outputNotes().numNotes() > 0 && (
      <>
        <p>Output notes:</p>
        <ul className="ml-6 list-disc [&>li]:mt-2">
          {transactionRecord
            .outputNotes()
            .notes()
            .map((note) => (
              <li key={note.id().toString()}>
                <NoteId noteId={note.id().toString()} />
              </li>
            ))}
        </ul>
      </>
    )}
  </>
);

const TransactionPreview = ({
  transactionResult,
}: {
  transactionResult: WasmTransactionResultType;
}) => {
  const { accounts } = useAccounts();
  const executedTransaction = transactionResult.executedTransaction();
  const accountId = executedTransaction.accountId().toString();
  const consumedNotes = executedTransaction.inputNotes().numNotes();
  const createdNotes = executedTransaction.outputNotes().numNotes();
  // `accountPatch()` replaced `accountDelta()` in SDK 0.16: it reports the
  // absolute post-execution state rather than a relative change. Storage is
  // absolute in both models, but the vault and nonce below need the account's
  // current state to be expressed as the deltas this preview renders.
  const accountPatch = executedTransaction.accountPatch();
  const accountStoragePatch = accountPatch.storage();
  const accountVaultPatch = accountPatch.vault();
  const finalNonce = accountPatch.finalNonce()?.asInt();
  const account = accounts.find(({ id }) => id === accountId);
  const accountNonce = account?.nonce ?? 0;
  const accountStorage = account?.storage ?? [];
  const storageDeltaValues = accountStoragePatch
    .values()
    .map((word) => word.toHex());
  const currentAmounts = new Map(
    (account?.fungibleAssets ?? []).map(({ faucetId, amount }) => [
      faucetId,
      BigInt(amount),
    ]),
  );
  const signedAmount = (amount: bigint) =>
    amount < 0n ? amount.toString() : `+${amount}`;
  const fungibleAssetDeltas = [
    // Assets whose final balance changed: subtract the current balance to
    // recover the delta.
    ...accountVaultPatch.updatedFungibleAssets().map((asset) => {
      const faucetId = asset.faucetId().toString();
      return {
        faucetId,
        amount: signedAmount(
          asset.amount() - (currentAmounts.get(faucetId) ?? 0n),
        ),
      };
    }),
    // Assets removed outright have no entry above; their final balance is zero,
    // so the delta is the whole current balance.
    ...accountVaultPatch.removedAssetIds().map((assetId) => {
      const faucetId = WasmFungibleAsset.fromVaultKey(assetId, 0n)
        .faucetId()
        .toString();
      return {
        faucetId,
        amount: signedAmount(-(currentAmounts.get(faucetId) ?? 0n)),
      };
    }),
  ];
  const storageDelta = accountStorage
    .filter(({ type }) => type === "value")
    .map((before, index) =>
      storageDeltaValues[index] !== undefined &&
      before.item !== storageDeltaValues[index]
        ? { index, before, after: storageDeltaValues[index] }
        : { index, before: defaultStorageItem(), after: "" },
    )
    .filter(({ after }) => after !== "");
  return (
    <div className="flex flex-col gap-2 text-sm">
      <h5 className="font-semibold">
        The transaction will have the following effects:
      </h5>
      {consumedNotes === 0 ? (
        <p className="text-muted-foreground text-sm">
          No notes will be consumed.
        </p>
      ) : (
        <p>
          <strong>
            {consumedNotes} note{consumedNotes === 1 ? "" : "s"}
          </strong>{" "}
          will be consumed as a result of this transaction.
        </p>
      )}
      {createdNotes === 0 ? (
        <p className="text-muted-foreground text-sm">
          No notes will be created.
        </p>
      ) : (
        <p>
          <strong>
            {createdNotes} note{createdNotes === 1 ? "" : "s"}
          </strong>{" "}
          will be created as a result of this transaction.
        </p>
      )}
      <h5 className="font-semibold">
        The account with ID{" "}
        <AccountAddress
          id={transactionResult.executedTransaction().accountId().toString()}
          withLink={false}
          withTooltip={false}
          withCopyButton={false}
        />{" "}
        will be modified as follows:
      </h5>
      <h5 className="font-semibold">Storage changes:</h5>
      {storageDelta.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Storage will not be changed.
        </p>
      ) : (
        <AccountStorageDeltaTable storageDelta={storageDelta} />
      )}
      <h5 className="font-semibold">Vault changes:</h5>
      {fungibleAssetDeltas.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Account Vault will not be changed.
        </p>
      ) : (
        <FungibleAssetsTable
          fungibleAssets={fungibleAssetDeltas}
          withAccountAddress={false}
        />
      )}
      <strong>
        New nonce: {finalNonce === undefined ? accountNonce : Number(finalNonce)}
        .
      </strong>
    </div>
  );
};

const CreateTransactionPreviewForm = ({
  executingAccountId,
  transactionRequest,
  transactionResult,
  setLoading,
  onClose,
}: {
  executingAccountId: string;
  transactionRequest: WasmTransactionRequestType;
  transactionResult: WasmTransactionResultType;
  setLoading: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
}) => {
  const { submitNewTransaction } = useTransactions();
  return (
    <form
      id="create-transaction-preview-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        const transactionRecord = await submitNewTransaction({
          accountId: executingAccountId,
          transactionRequest,
          transactionResult,
        });
        toast("Successfully created transaction.", {
          description: (
            <SubmitTransactionToastDescription
              transactionRecord={transactionRecord}
            />
          ),
        });
        setLoading(false);
        onClose();
      }}
    >
      <TransactionPreview transactionResult={transactionResult} />
    </form>
  );
};

export default CreateTransactionPreviewForm;
