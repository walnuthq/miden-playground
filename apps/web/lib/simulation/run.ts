import {
  AccountBuilder as WasmAccountBuilder,
  AccountId as WasmAccountId,
  AccountStorageMode as WasmAccountStorageMode,
  AdviceInputs as WasmAdviceInputs,
  type ExecutedTransaction as WasmExecutedTransactionType,
  MidenArrays as WasmMidenArrays,
  TransactionRequestBuilder as WasmTransactionRequestBuilder,
  type WebClient as WebClientType,
} from "@miden-sdk/miden-sdk";
import type { StorageSlot } from "@/lib/types/component";
import type { MidenInput, ProcedureExport, Script } from "@/lib/types/script";
import {
  cleanExecutionError,
  decodeProcedureResult,
} from "@/lib/utils/procedure-inputs";
import type { StorageChanges } from "@/lib/utils/storage-slots";
import {
  procedureCallScript,
  wasmAccountComponent,
  wasmAccountToAccount,
} from "@/lib/web-client";

// A simulation's outcome. Nothing is proven, submitted or saved.
export type SimulationResult =
  | {
      ok: true;
      // What the procedure returned, as text. Empty when it returns nothing.
      value: string;
      // The transaction's effects. Missing for a read-only procedure, which
      // runs as a program.
      executedTransaction?: WasmExecutedTransactionType;
    }
  | { ok: false; error: string };

// How many felts of the stack a result can take.
const RESULT_FELTS = 16;

// A throwaway account holding the script's component, with the basic wallet
// (to hold assets) and no authentication, at nonce 0. Its id depends on its
// storage: every change of slots is a new account.
export const createSimulatedAccount = async ({
  client,
  script,
  storageSlots,
}: {
  client: WebClientType;
  script: Script;
  storageSlots: StorageSlot[];
}) => {
  const builder = await client.createCodeBuilder();
  const seed = crypto.getRandomValues(new Uint8Array(32));
  const { account } = new WasmAccountBuilder(seed)
    .storageMode(WasmAccountStorageMode.public())
    .withBasicWalletComponent()
    .withNoAuthComponent()
    .withComponent(wasmAccountComponent({ builder, script, storageSlots }))
    .build();
  await client.newAccount(account, true);
  // Its state before any run: what a run's changes are shown against. Slots
  // of its other components included, which a new account's first
  // transaction reports as created.
  return wasmAccountToAccount({
    wasmAccount: account,
    name: script.name,
    components: [],
  });
};

const errorMessage = (error: unknown) =>
  cleanExecutionError(error instanceof Error ? error.message : String(error));

// The value a procedure leaves on the stack, run as a program: its changes
// are discarded.
const procedureValue = async ({
  client,
  accountId,
  script,
  procedureExport,
  procedureInputs,
}: {
  client: WebClientType;
  accountId: string;
  script: Script;
  procedureExport: ProcedureExport;
  procedureInputs: MidenInput[];
}) => {
  if (procedureExport.signature.results.length === 0) {
    return "";
  }
  // The raw client returns a FeltArray, not an array.
  const stack = await client.executeProgram(
    WasmAccountId.fromHex(accountId),
    await procedureCallScript({
      client,
      script,
      procedureExport,
      procedureInputs,
    }),
    new WasmAdviceInputs(),
    new WasmMidenArrays.ForeignAccountArray(),
  );
  const felts = Array.from(
    { length: Math.min(RESULT_FELTS, stack.length()) },
    (_, index) => stack.get(index).asInt(),
  );
  return decodeProcedureResult(procedureExport.signature, felts);
};

// Runs one of an account component's procedures against an account of the
// client's store. A read-only procedure runs as a program and returns its
// value; another runs as a transaction, executed only, and returns its
// effects along with its value.
export const simulateProcedure = async ({
  client,
  accountId,
  script,
  procedureExport,
  procedureInputs = [],
}: {
  client: WebClientType;
  accountId: string;
  script: Script;
  procedureExport: ProcedureExport;
  procedureInputs?: MidenInput[];
}): Promise<SimulationResult> => {
  try {
    const call = {
      client,
      accountId,
      script,
      procedureExport,
      procedureInputs,
    };
    if (procedureExport.readOnly) {
      return { ok: true, value: await procedureValue(call) };
    }
    const transactionResult = await client.executeTransaction(
      WasmAccountId.fromHex(accountId),
      new WasmTransactionRequestBuilder()
        .withCustomScript(
          await procedureCallScript({
            client,
            script,
            procedureExport,
            procedureInputs,
          }),
        )
        .build(),
    );
    return {
      ok: true,
      value: await procedureValue(call),
      executedTransaction: transactionResult.executedTransaction(),
    };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
};

// A transaction's storage changes, with words in hex.
export const storageChanges = (
  executedTransaction: WasmExecutedTransactionType,
): StorageChanges => {
  const storagePatch = executedTransaction.accountPatch().storage();
  return {
    values: storagePatch
      .valueSlots()
      .flatMap(({ slotName, value }) =>
        value ? [{ name: slotName, value: value.toHex() }] : [],
      ),
    entries: storagePatch.mapSlots().flatMap((mapSlotPatch) =>
      mapSlotPatch.entries().map(({ key, value }) => ({
        name: mapSlotPatch.slotName,
        key: key.toHex(),
        value: value.toHex(),
      })),
    ),
  };
};
