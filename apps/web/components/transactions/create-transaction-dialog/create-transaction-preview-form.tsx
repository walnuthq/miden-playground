import { type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import useTransactions from "@/hooks/use-transactions";
import {
  type TransactionResult,
  type TransactionRecord,
} from "@workspace/mock-web-client";
import { formatId } from "@/lib/utils";
import FungibleAssetsTable from "@/components/lib/fungible-assets-table";
import AccountAddress from "@/components/lib/account-address";
import AccountStorageDeltaTable from "@/components/lib/account-storage-delta-table";

const SubmitTransactionToastDescription = ({
  transactionRecord,
}: {
  transactionRecord: TransactionRecord;
}) => (
  <>
    <p>Transaction ID: {formatId(transactionRecord.id().toHex())}</p>
    {transactionRecord.outputNotes().numNotes() > 0 && (
      <>
        <p>Output notes:</p>
        <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
          {transactionRecord
            .outputNotes()
            .notes()
            .map((note) => (
              <li key={note.id().toString()}>
                {formatId(note.id().toString())}
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
  transactionResult: TransactionResult;
}) => {
  const consumedNotes = transactionResult.consumedNotes().numNotes();
  const createdNotes = transactionResult.createdNotes().numNotes();
  const accountStorageDelta = transactionResult.accountDelta().storage();
  const accountVaultDelta = transactionResult.accountDelta().vault();
  const fungibleAssetDelta = accountVaultDelta.fungible();
  const nonceDelta = transactionResult.accountDelta().nonceDelta()?.asInt();
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p>The transaction will have the following effects:</p>
      <p>
        {consumedNotes === 0
          ? "No notes will be consumed."
          : `${consumedNotes} note${
              consumedNotes === 1 ? "" : "s"
            } will be consumed as a result of this transaction.`}
      </p>
      <p>
        {createdNotes === 0
          ? "No notes will be created."
          : `${createdNotes} note${
              createdNotes === 1 ? "" : "s"
            } will be created as a result of this transaction.`}
      </p>
      <p>
        The account with ID{" "}
        <AccountAddress
          id={transactionResult.executedTransaction().accountId().toString()}
          withLink={false}
          withTooltip={false}
          withCopyButton={false}
        />{" "}
        will be modified as follows:
      </p>
      <p>Storage changes:</p>
      {accountStorageDelta.isEmpty() ? (
        <p>Storage will not be changed.</p>
      ) : (
        <AccountStorageDeltaTable
          values={accountStorageDelta.values().map((word) => word.toHex())}
        />
      )}
      <p>Vault changes:</p>
      {fungibleAssetDelta.isEmpty() ? (
        <p>Account Vault will not be changed.</p>
      ) : (
        <FungibleAssetsTable
          fungibleAssets={fungibleAssetDelta
            .assets()
            .map(({ faucetId, amount }) => ({
              faucetId: faucetId.toString(),
              amount: amount < 0n ? amount.toString() : `+${amount}`,
            }))}
          withAccountAddress={false}
        />
      )}
      <p>New nonce: {nonceDelta}.</p>
    </div>
  );
};

const CreateTransactionPreviewForm = ({
  transactionResult,
  setLoading,
  onClose,
}: {
  transactionResult: TransactionResult;
  setLoading: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
}) => {
  const { submitTransaction } = useTransactions();
  return (
    <form
      id="create-transaction-preview-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        const transactionRecord = await submitTransaction(transactionResult);
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
