import { type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import useTransactions from "@/hooks/use-transactions";
import {
  type TransactionResult,
  type TransactionRecord,
} from "@workspace/mock-web-client";
import FungibleAssetsTable from "@/components/lib/fungible-assets-table";
import AccountAddress from "@/components/lib/account-address";
import AccountStorageDeltaTable from "@/components/lib/account-storage-delta-table";
import TransactionId from "@/components/lib/transaction-id";
import NoteId from "@/components/lib/note-id";

const SubmitTransactionToastDescription = ({
  transactionRecord,
}: {
  transactionRecord: TransactionRecord;
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
  transactionResult: TransactionResult;
}) => {
  const consumedNotes = transactionResult.consumedNotes().numNotes();
  const createdNotes = transactionResult.createdNotes().numNotes();
  const accountStorageDelta = transactionResult.accountDelta().storage();
  const accountVaultDelta = transactionResult.accountDelta().vault();
  const fungibleAssetDelta = accountVaultDelta.fungible();
  const nonceDelta = transactionResult.accountDelta().nonceDelta()?.asInt();
  // const consumedNotes = 0;
  // const createdNotes = 1;
  // const accountStorageDelta = { isEmpty: () => true };
  // const fungibleAssetDelta = { isEmpty: () => true };
  // const nonceDelta = 1;
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
      {accountStorageDelta.isEmpty() ? (
        <p className="text-muted-foreground text-sm">
          Storage will not be changed.
        </p>
      ) : (
        <AccountStorageDeltaTable
          values={accountStorageDelta.values().map((word) => word.toHex())}
        />
      )}
      <h5 className="font-semibold">Vault changes:</h5>
      {fungibleAssetDelta.isEmpty() ? (
        <p className="text-muted-foreground text-sm">
          Account Vault will not be changed.
        </p>
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
      <strong>New nonce: {nonceDelta}.</strong>
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
