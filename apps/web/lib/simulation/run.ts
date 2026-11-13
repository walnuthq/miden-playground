import {
  AccountBuilder as WasmAccountBuilder,
  AccountId as WasmAccountId,
  AccountStorageMode as WasmAccountStorageMode,
  AdviceInputs as WasmAdviceInputs,
  type ExecutedTransaction as WasmExecutedTransactionType,
  MidenArrays as WasmMidenArrays,
  NoteAndArgs as WasmNoteAndArgs,
  Package as WasmPackage,
  TransactionRequestBuilder as WasmTransactionRequestBuilder,
  TransactionScript as WasmTransactionScript,
  Word as WasmWord,
  type WebClient as WebClientType,
} from "@miden-sdk/miden-sdk";
import type { StorageSlot } from "@/lib/types/component";
import type { MidenInput, ProcedureExport, Script } from "@/lib/types/script";
import { fromBase64 } from "@/lib/utils";
import {
  cleanExecutionError,
  decodeProcedureResult,
} from "@/lib/utils/procedure-inputs";
import { type StorageChanges, wordFelts } from "@/lib/utils/storage-slots";
import {
  clientCreateNoteFromScript,
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

// A script's `Word` argument, written as a felt or a word in hex. None when
// empty.
const wordArgument = (text: string) =>
  text.trim() === ""
    ? undefined
    : new WasmWord(new BigUint64Array(wordFelts(text)));

// The executor asks the keystore for a signature it doesn't have.
const AUTH_REQUEST_EVENT = "miden::protocol::auth::request";

const targetErrorMessage = (error: unknown) => {
  const message = errorMessage(error);
  return message.includes(AUTH_REQUEST_EVENT)
    ? `${message}\nThis account's key isn't in the Playground, so its transactions can't be simulated: pick a No Auth account or a wallet created here.`
    : message;
};

// Runs a note script as if the account consumed a note made from it: the
// note, never submitted, is an unauthenticated input of a transaction that is
// executed only. The client's store isn't written to.
export const simulateNote = async ({
  client,
  targetAccountId,
  script,
  scripts,
  noteStorage,
  faucetAccountId,
  amount,
  noteArgument,
}: {
  client: WebClientType;
  targetAccountId: string;
  script: Script;
  // The workspace's scripts, for a built-in note script's dependencies.
  scripts: Script[];
  // The note's storage, as felts.
  noteStorage: string[];
  // The asset the note carries: none when empty.
  faucetAccountId: string;
  amount: bigint;
  noteArgument: string;
}): Promise<SimulationResult> => {
  try {
    const note = await clientCreateNoteFromScript({
      client,
      senderAccountId: targetAccountId,
      recipientAccountId: targetAccountId,
      isNetworkNote: false,
      script,
      type: "public",
      faucetAccountId,
      amount,
      noteStorage,
      scripts,
    });
    const transactionResult = await client.executeTransaction(
      WasmAccountId.fromHex(targetAccountId),
      new WasmTransactionRequestBuilder()
        .withInputNotes(
          new WasmMidenArrays.NoteAndArgsArray([
            new WasmNoteAndArgs(note, wordArgument(noteArgument)),
          ]),
        )
        .build(),
    );
    return {
      ok: true,
      value: "",
      executedTransaction: transactionResult.executedTransaction(),
    };
  } catch (error) {
    return { ok: false, error: targetErrorMessage(error) };
  }
};

// Runs a compiled transaction script against the account, executed only.
export const simulateTransactionScript = async ({
  client,
  targetAccountId,
  script,
  scriptArgument,
}: {
  client: WebClientType;
  targetAccountId: string;
  script: Script;
  scriptArgument: string;
}): Promise<SimulationResult> => {
  try {
    const builder = new WasmTransactionRequestBuilder().withCustomScript(
      WasmTransactionScript.fromPackage(
        WasmPackage.deserialize(fromBase64(script.masp)),
      ),
    );
    const argument = wordArgument(scriptArgument);
    const transactionResult = await client.executeTransaction(
      WasmAccountId.fromHex(targetAccountId),
      (argument ? builder.withScriptArg(argument) : builder).build(),
    );
    return {
      ok: true,
      value: "",
      executedTransaction: transactionResult.executedTransaction(),
    };
  } catch (error) {
    return { ok: false, error: targetErrorMessage(error) };
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
