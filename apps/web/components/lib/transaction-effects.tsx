import type { ExecutedTransaction as WasmExecutedTransactionType } from "@miden-sdk/miden-sdk";
import { FungibleAsset as WasmFungibleAsset } from "@miden-sdk/miden-sdk";
import AccountAddress from "@/components/lib/account-address";
import AccountStorageDeltaTable from "@/components/lib/account-storage-delta-table";
import FungibleAssetsTable from "@/components/lib/fungible-assets-table";
import { EMPTY_WORD } from "@/lib/constants";
import type { Account } from "@/lib/types/account";
import { getItem, getMapItem } from "@/lib/utils/account";

export type TransactionBaseline = Pick<
  Account,
  "nonce" | "storage" | "fungibleAssets"
>;

// What an executed transaction changes: the notes it consumes and creates,
// and its account's storage, vault, fees and nonce. `baseline` is the
// account's state before it, which the changes are shown against.
const TransactionEffects = ({
  executedTransaction,
  baseline,
  accountLabel,
}: {
  executedTransaction: WasmExecutedTransactionType;
  baseline?: TransactionBaseline;
  // Names the account instead of its address, for one that has none worth
  // showing: "simulated account".
  accountLabel?: string;
}) => {
  const accountId = executedTransaction.accountId().toString();
  const consumedNotes = executedTransaction.inputNotes().numNotes();
  // `userOutputNotes()` drops the kernel's `TX_FEE` note, which `outputNotes()`
  // includes on any chain whose verification base fee is non-zero. The fee note
  // is reported on its own below rather than counted as a created note.
  const createdNotes = executedTransaction.userOutputNotes().length;
  const feeNote = executedTransaction.feeNote();
  const feeAmounts = new Map(
    (feeNote?.assets()?.fungibleAssets() ?? []).map((asset) => [
      asset.faucetId().toString(),
      asset.amount(),
    ]),
  );
  const feeAssets = [...feeAmounts].map(([faucetId, amount]) => ({
    faucetId,
    amount: amount.toString(),
  }));
  // `accountPatch()` replaced `accountDelta()` in SDK 0.16: it reports the
  // absolute post-execution state rather than a relative change. Storage is
  // absolute in both models, but the vault and nonce below need the account's
  // current state to be expressed as the deltas this preview renders.
  const accountPatch = executedTransaction.accountPatch();
  const accountStoragePatch = accountPatch.storage();
  const accountVaultPatch = accountPatch.vault();
  const finalNonce = accountPatch.finalNonce()?.asInt();
  const accountNonce = baseline?.nonce ?? 0;
  const accountStorage = baseline?.storage ?? [];
  const currentAmounts = new Map(
    (baseline?.fungibleAssets ?? []).map(({ faucetId, amount }) => [
      faucetId,
      BigInt(amount),
    ]),
  );
  const signedAmount = (amount: bigint) =>
    amount < 0n ? amount.toString() : `+${amount}`;
  // The fee also leaves the account's vault, but it is reported on its own
  // under "Transaction fees" below, so add it back here to keep it out of the
  // vault delta instead of listing the same outflow twice.
  const withoutFee = (faucetId: string, amount: bigint) =>
    amount + (feeAmounts.get(faucetId) ?? 0n);
  const fungibleAssetDeltas = [
    // Assets whose final balance changed: subtract the current balance to
    // recover the delta.
    ...accountVaultPatch.updatedFungibleAssets().map((asset) => {
      const faucetId = asset.faucetId().toString();
      return {
        faucetId,
        amount: withoutFee(
          faucetId,
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
        amount: withoutFee(faucetId, -(currentAmounts.get(faucetId) ?? 0n)),
      };
    }),
  ]
    // An asset the transaction only ever moved to pay the fee nets out to zero.
    .filter(({ amount }) => amount !== 0n)
    .map(({ faucetId, amount }) => ({
      faucetId,
      amount: signedAmount(amount),
    }));
  // Value slots report their final value, or none when the slot is removed:
  // compare it to the account's current value to recover the change.
  const valueStorageDelta = accountStoragePatch
    .valueSlots()
    .map((valueSlotPatch) => {
      const name = valueSlotPatch.slotName;
      const storageItem = accountStorage.find(
        (storageItem) => storageItem.name === name,
      );
      return {
        name,
        before: getItem(storageItem),
        after: valueSlotPatch.value?.toHex() ?? EMPTY_WORD,
      };
    })
    .filter(({ before, after }) => before !== after);
  // Map slots only report their changed entries, with each entry's final
  // value: compare them to the account's current entries to recover the change.
  const mapStorageDelta = accountStoragePatch
    .mapSlots()
    .flatMap((mapSlotPatch) => {
      const name = mapSlotPatch.slotName;
      const storageItem = accountStorage.find(
        (storageItem) => storageItem.name === name,
      );
      return mapSlotPatch.entries().map((entry) => {
        const key = entry.key.toHex();
        return {
          name,
          key,
          before: getMapItem(storageItem, key),
          after: entry.value.toHex(),
        };
      });
    })
    .filter(({ before, after }) => before !== after);
  const storageDelta = [...valueStorageDelta, ...mapStorageDelta];
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
        {accountLabel ? (
          `The ${accountLabel}`
        ) : (
          <>
            The account with ID{" "}
            <AccountAddress
              id={accountId}
              withLink={false}
              withTooltip={false}
              withCopyButton={false}
            />
          </>
        )}{" "}
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
      <h5 className="font-semibold">Transaction fees:</h5>
      {feeAssets.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          This transaction will not pay any fees.
        </p>
      ) : (
        <FungibleAssetsTable
          fungibleAssets={feeAssets}
          withAccountAddress={false}
        />
      )}
      <strong>
        New nonce:{" "}
        {finalNonce === undefined ? accountNonce : Number(finalNonce)}.
      </strong>
    </div>
  );
};

export default TransactionEffects;
