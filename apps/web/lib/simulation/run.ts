import {
  getWasmOrThrow,
  type MockWasmWebClient,
  AccountBuilder as WasmAccountBuilder,
  AccountId as WasmAccountId,
  AccountStorageMode as WasmAccountStorageMode,
  AdviceInputs as WasmAdviceInputs,
  type ExecutedTransaction as WasmExecutedTransactionType,
  FungibleAsset as WasmFungibleAsset,
  MidenArrays as WasmMidenArrays,
  Note as WasmNote,
  NoteAndArgs as WasmNoteAndArgs,
  NoteAssets as WasmNoteAssets,
  NoteAttachment as WasmNoteAttachment,
  NoteType as WasmNoteType,
  Package as WasmPackage,
  TransactionRequestBuilder as WasmTransactionRequestBuilder,
  TransactionScript as WasmTransactionScript,
  Word as WasmWord,
  type WebClient as WebClientType,
} from "@miden-sdk/miden-sdk";
import { simulationBlockedReason } from "@/lib/simulation/blocked";
import { recordStaging } from "@/lib/simulation/simulation-client";
import type { Account } from "@/lib/types/account";
import type { NoteType } from "@/lib/types/note";
import type { MidenInput, ProcedureExport, Script } from "@/lib/types/script";
import type { StorageSlot } from "@/lib/types/storage-slot";
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

// A component of a simulated account: a package and the storage slots it
// starts from.
export type SimulatedComponent = {
  script: Script;
  storageSlots: StorageSlot[];
};

// An asset a simulated account's vault starts with, or a note carries: a
// faucet of the mock client (or a sandbox faucet, for a note on a sandbox
// account) and an amount in base units.
export type SimulatedAsset = { faucetId: string; amount: bigint };

// Puts the assets in the account's vault: the account consumes a P2ID note
// carrying them (the standard basic wallet takes it), and the transaction is
// applied to the client's store, never submitted. `AccountBuilder` can't build
// an account with assets, and the mock chain can't hold the transaction: its
// note was never created on the chain, so the block that holds it fails to
// build (`unauthenticated note … was not created in the same block`), and so
// does every later block, a foreign account's staging included. Applied to the
// store alone, the account is at nonce 1 with the assets for every run that
// executes against it, transaction or program. The faucets needn't be minted
// from, nor committed. About 80 ms the first time, 20 ms after (2026-11-17).
// It writes to the client's store: never call it on the app's client.
export const seedVault = async ({
  client,
  accountId,
  assets,
}: {
  client: MockWasmWebClient;
  accountId: string;
  assets: SimulatedAsset[];
}) => {
  const account = WasmAccountId.fromHex(accountId);
  const note = WasmNote.createP2IDNote(
    account,
    account,
    new WasmNoteAssets(
      assets.map(
        ({ faucetId, amount }) =>
          new WasmFungibleAsset(WasmAccountId.fromHex(faucetId), amount),
      ),
    ),
    WasmNoteType.Public,
    new WasmNoteAttachment(),
  );
  const transactionResult = await client.executeTransaction(
    account,
    new WasmTransactionRequestBuilder()
      .withInputNotes(
        new WasmMidenArrays.NoteAndArgsArray([new WasmNoteAndArgs(note)]),
      )
      .build(),
  );
  await client.applyTransaction(
    transactionResult,
    await client.getSyncHeight(),
  );
};

// A throwaway account holding the components, with the standard basic wallet
// (to hold assets) and no authentication. Its id depends on its storage, not
// its vault: every change of slots is a new account. Nothing is committed: an
// account the chain never saw runs a transaction script or consumes an
// unauthenticated note all the same. Without assets it's at nonce 0; with
// some, `seedVault` puts them in its vault and it's at nonce 1. It writes to
// the client's store: the mock client's only.
export const createSimulatedAccount = async ({
  client,
  name,
  components,
  assets = [],
}: {
  client: MockWasmWebClient;
  name: string;
  components: SimulatedComponent[];
  assets?: SimulatedAsset[];
}) => {
  const builder = await client.createCodeBuilder();
  const seed = crypto.getRandomValues(new Uint8Array(32));
  const accountBuilder = components.reduce(
    (accountBuilder, { script, storageSlots }) =>
      accountBuilder.withComponent(
        wasmAccountComponent({ builder, script, storageSlots }),
      ),
    new WasmAccountBuilder(seed)
      .storageMode(WasmAccountStorageMode.public())
      .withBasicWalletComponent()
      .withNoAuthComponent(),
  );
  const { account } = accountBuilder.build();
  await client.newAccount(account, true);
  if (assets.length === 0) {
    // Its state before any run: what a run's changes are shown against.
    // Slots of its other components included, which a new account's first
    // transaction reports as created.
    return wasmAccountToAccount({ wasmAccount: account, name, components: [] });
  }
  await seedVault({
    client,
    accountId: account.id().toString(),
    assets,
  });
  // Its state after the seed: the seed is never shown as a change.
  const seeded = await client.getAccount(account.id());
  if (!seeded) {
    throw new Error("The simulated account isn't in the client's store.");
  }
  return wasmAccountToAccount({ wasmAccount: seeded, name, components: [] });
};

// The fungible faucet of a simulated asset: an asset in a note or a vault
// makes the client load its faucet as a foreign account, from its own store
// first, then from the RPC, which on the mock client panics on an account its
// chain doesn't hold (any sandbox faucet). A faucet created in the mock client
// is enough, uncommitted. One per client and symbol (about 300 ms): a client
// that was reset gets new ones.
const mockFaucets = new WeakMap<
  MockWasmWebClient,
  Map<string, Promise<string>>
>();

// Base units: the most a fungible asset can hold is 2^63 - 2^31.
const MOCK_FAUCET_MAX_SUPPLY = 10n ** 18n;

// How the result dialog shows a simulated asset: the app doesn't know its
// faucet. The form takes amounts in base units: without decimals, the dialog
// shows the same number.
export const mockFaucetLabel = (symbol: string) => ({
  name: "Simulated asset",
  symbol,
  decimals: 0,
});

export const mockFaucet = (client: MockWasmWebClient, symbol: string) => {
  let faucets = mockFaucets.get(client);
  if (!faucets) {
    faucets = new Map();
    mockFaucets.set(client, faucets);
  }
  let faucetId = faucets.get(symbol);
  if (!faucetId) {
    faucetId = (async () => {
      // The package's `AuthScheme` export is the friendly string const; the
      // raw client takes the wasm module's numeric enum, which only the wasm
      // module exports (as in lib/para-client.ts).
      const { AuthScheme } = await getWasmOrThrow();
      const faucet = await client.newFaucet(
        WasmAccountStorageMode.public(),
        false,
        "Simulated",
        symbol,
        mockFaucetLabel(symbol).decimals,
        MOCK_FAUCET_MAX_SUPPLY,
        AuthScheme.AuthRpoFalcon512,
      );
      return faucet.id().toString();
    })();
    const created = faucetId;
    faucets.set(symbol, created);
    created.catch(() => {
      if (faucets.get(symbol) === created) {
        faucets.delete(symbol);
      }
    });
  }
  return faucetId;
};

// The faucets of the simulated assets a run uses, by symbol, made one after
// the other: a client's calls aren't atomic as a group.
export const mockFaucetIds = async (
  client: MockWasmWebClient,
  symbols: string[],
) => {
  const faucetIds = new Map<string, string>();
  for (const symbol of symbols) {
    faucetIds.set(symbol, await mockFaucet(client, symbol));
  }
  return faucetIds;
};

// The labels the result dialog names the simulated assets by, by faucet id.
export const mockFaucetLabels = (faucetIds: Map<string, string>) =>
  Object.fromEntries(
    [...faucetIds].map(([symbol, faucetId]) => [
      faucetId,
      mockFaucetLabel(symbol),
    ]),
  );

// Stages an account component's foreign account on the mock chain: a
// simulated account made from the dependency's package and the storage
// slots shown, then committed in a block, so the mock RPC serves it to a
// foreign call (it serves only committed accounts, and its lazy fetch finds
// them without a declaration). An empty transaction commits it: No Auth bumps
// a new account's nonce. Proving on the mock client is a dummy proof. Each
// staging adds an account and a block to the mock chain: run it at Invoke,
// never on a slot edit. It writes to the client's store, which is the point
// of the mock client: never call it on the app's client.
export const stageForeignAccount = async ({
  client,
  script,
  storageSlots,
}: {
  client: MockWasmWebClient;
  script: Script;
  storageSlots: StorageSlot[];
}) => {
  recordStaging(client);
  const account = await createSimulatedAccount({
    client,
    name: script.name,
    components: [{ script, storageSlots }],
  });
  const transactionResult = await client.executeTransaction(
    WasmAccountId.fromHex(account.id),
    new WasmTransactionRequestBuilder().build(),
  );
  const provenTransaction = await client.proveTransaction(transactionResult);
  const submissionHeight = await client.submitProvenTransaction(
    provenTransaction,
    transactionResult,
  );
  await client.applyTransaction(transactionResult, submissionHeight);
  await client.proveBlock();
  await client.syncState();
  return account;
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
  foreignAccountsStaged = 0,
}: {
  client: WebClientType;
  accountId: string;
  script: Script;
  procedureExport: ProcedureExport;
  procedureInputs?: MidenInput[];
  // How many foreign accounts were staged on the client for this run.
  foreignAccountsStaged?: number;
}): Promise<SimulationResult> => {
  // The Invoke button is disabled for a foreign call with nothing staged:
  // this keeps any other caller from panicking the mock client's WASM.
  const blocked = simulationBlockedReason(procedureExport, {
    staged: foreignAccountsStaged,
  });
  if (blocked) {
    return { ok: false, error: blocked };
  }
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
    return { ok: false, error: targetErrorMessage(error) };
  }
};

// A script's `Word` argument, written as a felt or a word in hex. None when
// empty.
const wordArgument = (text: string) =>
  text.trim() === ""
    ? undefined
    : new WasmWord(new BigUint64Array(wordFelts(text)));

// The executor asks the keystore for a signature it doesn't have.
// (The hints below explain the kernel's bare error codes, for every run: a
// procedure's, a note's, a transaction script's.)
const AUTH_REQUEST_EVENT = "miden::protocol::auth::request";

// The kernel's check, at the end of a transaction, that no asset appeared or
// vanished (`ERR_EPILOGUE_TOTAL_NUMBER_OF_ASSETS_MUST_STAY_THE_SAME`,
// miden-protocol 0.17.1 `asm/kernels/transaction-core/src/epilogue.masm`). The
// executor reports the code only: the first felt of the Blake3 hash of the
// message "total number of assets in the account and all involved notes must
// stay the same" (`error_code_from_msg`, miden-core), so it changes if the
// message does.
const ASSETS_NOT_CONSERVED_CODE = "4544980346559459778";

// The kernel's check that a vault holds what is removed from it
// (`ERR_VAULT_FUNGIBLE_ASSET_AMOUNT_LESS_THAN_AMOUNT_TO_WITHDRAW`, same file's
// kernel): "failed to remove the fungible asset from the vault since the
// amount of the asset in the vault is less than the amount to remove".
const VAULT_SHORT_CODE = "644413868907058392";

const targetErrorHint = (message: string) => {
  if (message.includes(AUTH_REQUEST_EVENT)) {
    return "This account's key isn't in the Playground, so its transactions can't be simulated: pick a No Auth account or a wallet created here.";
  }
  if (message.includes(`error code: ${ASSETS_NOT_CONSERVED_CODE}`)) {
    return "The assets of the account and the notes must add up to the same total before and after the transaction. A note's asset isn't received on its own: the script has to move each one to the account (the wallet's receive_asset) or to an output note. Run the note without an asset if its script doesn't take one.";
  }
  if (message.includes(`error code: ${VAULT_SHORT_CODE}`)) {
    return "The account's vault holds less of the asset than the transaction removes from it. On the simulated account, add the asset to its vault, or raise its amount.";
  }
  return undefined;
};

const targetErrorMessage = (error: unknown) => {
  const message = errorMessage(error);
  const hint = targetErrorHint(message);
  return hint ? `${message}\n${hint}` : message;
};

// Runs a note script as if the account consumed a note made from it: the
// note, never submitted, is an unauthenticated input of a transaction that is
// executed only. The client's store isn't written to.
export const simulateNote = async ({
  client,
  targetAccountId,
  senderAccountId = targetAccountId,
  noteType = "public",
  isNetworkNote = false,
  script,
  scripts,
  noteStorage,
  assets,
  noteArgument,
}: {
  client: WebClientType;
  targetAccountId: string;
  // The note's sender, its type and whether it's a network note, as the
  // Create Note dialog would create it. The Simulate tab's note is the
  // target's own, public, regular.
  senderAccountId?: string;
  noteType?: NoteType;
  isNetworkNote?: boolean;
  script: Script;
  // The workspace's scripts, for a built-in note script's dependencies.
  scripts: Script[];
  // The note's storage, as felts.
  noteStorage: string[];
  // The assets the note carries.
  assets: SimulatedAsset[];
  noteArgument: string;
}): Promise<SimulationResult> => {
  try {
    const note = await clientCreateNoteFromScript({
      client,
      senderAccountId,
      recipientAccountId: targetAccountId,
      isNetworkNote,
      script,
      type: noteType,
      assets,
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

// A run on one of the sandbox's accounts, in the app's client, with the
// account's state in app state it ran from: what the result dialog shows the
// changes against. Execution only: nothing is written to the store.
export const runOnSandboxAccount = async ({
  client,
  accounts,
  accountId,
  run,
}: {
  client: WebClientType | null | undefined;
  accounts: Account[];
  accountId: string;
  run: (client: WebClientType) => Promise<SimulationResult>;
}): Promise<{ result: SimulationResult; account?: Account }> => {
  const account = accounts.find(({ id }) => id === accountId);
  if (!client || !account) {
    return {
      result: { ok: false, error: "The client or the account isn't ready." },
      account,
    };
  }
  try {
    return { result: await run(client), account };
  } catch (error) {
    return { result: { ok: false, error: errorMessage(error) }, account };
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

// The final balances of the vault's assets a transaction changed, by faucet
// id: an asset it removed outright is at zero.
export const vaultBalances = (
  executedTransaction: WasmExecutedTransactionType,
): SimulatedAsset[] => {
  const vaultPatch = executedTransaction.accountPatch().vault();
  return [
    ...vaultPatch.updatedFungibleAssets().map((asset) => ({
      faucetId: asset.faucetId().toString(),
      amount: asset.amount(),
    })),
    ...vaultPatch.removedAssetIds().map((assetId) => ({
      faucetId: WasmFungibleAsset.fromVaultKey(assetId, 0n)
        .faucetId()
        .toString(),
      amount: 0n,
    })),
  ];
};

// How many of the vault's assets a transaction changed the balance of,
// against the account's state it ran from. The fee a sandbox account pays
// leaves its vault too, but isn't counted: the result dialog reports it
// apart, as the transaction dialog does (TransactionEffects).
export const changedAssets = (
  executedTransaction: WasmExecutedTransactionType,
  account: Pick<Account, "fungibleAssets">,
) => {
  const fees = new Map(
    (executedTransaction.feeNote()?.assets()?.fungibleAssets() ?? []).map(
      (asset) => [asset.faucetId().toString(), asset.amount()],
    ),
  );
  return vaultBalances(executedTransaction).filter(
    ({ faucetId, amount }) =>
      amount + (fees.get(faucetId) ?? 0n) !==
      BigInt(
        account.fungibleAssets.find((asset) => asset.faucetId === faucetId)
          ?.amount ?? "0",
      ),
  ).length;
};
