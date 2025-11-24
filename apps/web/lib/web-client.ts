import { range } from "lodash";
import {
  type Account as WasmAccountType,
  type WebClient as WebClientType,
  type InputNoteRecord as WasmInputNoteRecordType,
  type NoteMetadata as WasmNoteMetadataType,
  type Note as WasmNoteType,
  type TransactionResult as WasmTransactionResultType,
  type InputNoteState as WasmInputNoteStateType,
  type TransactionId as WasmTransactionIdType,
  type TransactionRequest as WasmTransactionRequestType,
} from "@demox-labs/miden-sdk";
import { type WasmTransactionRecordType } from "@/lib/types";
import {
  type Account,
  type AccountStorageMode,
  type AccountType,
  defaultAccount,
  newWallet,
} from "@/lib/types/account";
import { type NetworkId } from "@/lib/types/network";
import { type InputNote, type NoteType } from "@/lib/types/note";
import {
  type TransactionNote,
  type Transaction,
} from "@/lib/types/transaction";
import { type Script } from "@/lib/types/script";
import { type StorageSlot, type Component } from "@/lib/types/component";
import defaultScripts from "@/lib/types/default-scripts";
import { stringToFeltArray } from "@/lib/utils";
import { fromHex } from "viem";

const globalForWebClient = globalThis as unknown as {
  webClient: WebClientType;
};

export const webClient = async (
  networkId: NetworkId,
  serializedMockChain: Uint8Array | null
) => {
  if (networkId === "mlcl") {
    // @ts-expect-error MockWebClient not exported
    const { MockWebClient } = await import("@demox-labs/miden-sdk");
    return MockWebClient.createClient(serializedMockChain) as WebClientType;
  }
  const { WebClient } = await import("@demox-labs/miden-sdk");
  if (!globalForWebClient.webClient) {
    globalForWebClient.webClient = await WebClient.createClient();
  }
  return globalForWebClient.webClient;
};

const bigintToWord = async (value: bigint) => {
  const { Word: WasmWord } = await import("@demox-labs/miden-sdk");
  return new WasmWord(
    BigUint64Array.from(
      BigInt(value)
        .toString(16)
        .padStart(64, "0")
        .match(/.{1,16}/g)!
        .map((chunk) => BigInt(`0x${chunk}`))
    )
  );
};

export const clientNewWallet = async (
  client: WebClientType,
  {
    storageMode,
    mutable,
    initSeed,
  }: {
    storageMode: AccountStorageMode;
    mutable: boolean;
    initSeed?: Uint8Array;
  }
) => {
  const { AccountStorageMode: WasmAccountStorageMode } = await import(
    "@demox-labs/miden-sdk"
  );
  return client.newWallet(
    storageMode === "public"
      ? WasmAccountStorageMode.public()
      : WasmAccountStorageMode.private(),
    mutable,
    0,
    initSeed
  );
};

export const clientNewFaucet = async (
  client: WebClientType,
  {
    storageMode,
    nonFungible,
    tokenSymbol,
    decimals,
    maxSupply,
  }: {
    storageMode: AccountStorageMode;
    nonFungible: boolean;
    tokenSymbol: string;
    decimals: number;
    maxSupply: bigint;
  }
) => {
  const { AccountStorageMode: WasmAccountStorageMode } = await import(
    "@demox-labs/miden-sdk"
  );
  return client.newFaucet(
    storageMode === "public"
      ? WasmAccountStorageMode.public()
      : WasmAccountStorageMode.private(),
    nonFungible,
    tokenSymbol,
    decimals,
    maxSupply,
    0
  );
};

export const clientNewAccount = (
  client: WebClientType,
  { account, overwrite }: { account: WasmAccountType; overwrite: boolean }
) => client.newAccount(account, overwrite);

export const clientExecuteTransaction = async (
  client: WebClientType,
  {
    accountId,
    transactionRequest,
  }: { accountId: string; transactionRequest: WasmTransactionRequestType }
) => {
  const { AccountId: WasmAccountId } = await import("@demox-labs/miden-sdk");
  return client.executeTransaction(
    WasmAccountId.fromHex(accountId),
    transactionRequest
  );
};

export const clientNewMintTransactionRequest = async (
  client: WebClientType,
  {
    targetAccountId,
    faucetId,
    noteType,
    amount,
  }: {
    targetAccountId: string;
    faucetId: string;
    noteType: NoteType;
    amount: bigint;
  }
) => {
  const { AccountId: WasmAccountId, NoteType: WasmNoteType } = await import(
    "@demox-labs/miden-sdk"
  );
  const wasmNoteTypes = {
    public: WasmNoteType.Public,
    private: WasmNoteType.Private,
    encrypted: WasmNoteType.Encrypted,
  } as const;
  return client.newMintTransactionRequest(
    WasmAccountId.fromHex(targetAccountId),
    WasmAccountId.fromHex(faucetId),
    wasmNoteTypes[noteType],
    amount
  );
};

export const clientNewConsumeTransactionRequest = async (
  client: WebClientType,
  noteIds: string[]
) => client.newConsumeTransactionRequest(noteIds);

export const clientNewSendTransactionRequest = async (
  client: WebClientType,
  {
    senderAccountId,
    targetAccountId,
    faucetId,
    noteType,
    amount,
  }: {
    senderAccountId: string;
    targetAccountId: string;
    faucetId: string;
    noteType: NoteType;
    amount: bigint;
  }
) => {
  const { AccountId: WasmAccountId, NoteType: WasmNoteType } = await import(
    "@demox-labs/miden-sdk"
  );
  const wasmNoteTypes = {
    public: WasmNoteType.Public,
    private: WasmNoteType.Private,
    encrypted: WasmNoteType.Encrypted,
  } as const;
  return client.newSendTransactionRequest(
    WasmAccountId.fromHex(senderAccountId),
    WasmAccountId.fromHex(targetAccountId),
    WasmAccountId.fromHex(faucetId),
    wasmNoteTypes[noteType],
    amount
  );
};

export const clientGetAccountByAddress = async (
  client: WebClientType,
  address: string
) => {
  const { Address: WasmAddress } = await import("@demox-labs/miden-sdk");
  const accountId = WasmAddress.fromBech32(address).accountId();
  const account = await client.getAccount(accountId);
  if (account) {
    return account;
  }
  await client.importAccountById(accountId);
  await client.syncState();
  const importedAccount = await client.getAccount(accountId);
  if (!importedAccount) {
    throw new Error("Error importing account");
  }
  return importedAccount;
};

export const clientGetConsumableNotes = async (
  client: WebClientType,
  accountId: string
) => {
  const { AccountId: WasmAccountId } = await import("@demox-labs/miden-sdk");
  const wasmAccountId = WasmAccountId.fromHex(accountId);
  return client.getConsumableNotes(wasmAccountId);
};

export const clientGetAllInputNotes = async (
  client: WebClientType,
  previousInputNotes: InputNote[]
) => {
  const {
    NoteFilter: WasmNoteFilter,
    NoteFilterTypes: WasmNoteFilterTypes,
    RpcClient: WasmRpcClient,
    Endpoint: WasmEndpoint,
  } = await import("@demox-labs/miden-sdk");
  const wasmInputNotes = await client.getInputNotes(
    new WasmNoteFilter(WasmNoteFilterTypes.All)
  );
  if (client.usesMockChain()) {
    return Promise.all(
      wasmInputNotes.map((wasmInputNote) =>
        wasmInputNoteToInputNote(
          wasmInputNote,
          previousInputNotes.find(
            ({ id }) => id === wasmInputNote.id().toString()
          )
        )
      )
    );
  } else {
    const rpcClient = new WasmRpcClient(WasmEndpoint.testnet());
    const wasmFetchedNotes = await rpcClient.getNotesById(
      wasmInputNotes.map((wasmInputNote) => wasmInputNote.id())
    );
    const patchedWasmInputNotes = wasmInputNotes.map((wasmInputNote, index) => {
      wasmInputNote.metadata = () => wasmFetchedNotes[index]?.metadata;
      return wasmInputNote;
    });
    return Promise.all(
      patchedWasmInputNotes.map((wasmInputNote) =>
        wasmInputNoteToInputNote(
          wasmInputNote,
          previousInputNotes.find(
            ({ id }) => id === wasmInputNote.id().toString()
          )
        )
      )
    );
  }
};

export const clientGetTransactionsByIds = async (
  client: WebClientType,
  transactionIds: WasmTransactionIdType[]
): Promise<WasmTransactionRecordType[]> => {
  const { TransactionFilter: WasmTransactionFilter } = await import(
    "@demox-labs/miden-sdk"
  );
  return client.getTransactions(WasmTransactionFilter.ids(transactionIds));
};

export const clientImportNewWallet = async (
  client: WebClientType,
  address: string
) => {
  const { Account: WasmAccount, Address: WasmAddress } = await import(
    "@demox-labs/miden-sdk"
  );
  const accountId = WasmAddress.fromBech32(address).accountId();
  const serializedImportedWallet = Uint8Array.from([
    ...fromHex(accountId.toString() as `0x${string}`, "bytes"),
    ...newWallet.slice(15),
  ]);
  try {
    await clientNewAccount(client, {
      account: WasmAccount.deserialize(serializedImportedWallet),
      overwrite: true,
    });
    //  eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    //
  }
};

export const clientDeployAccount = async (
  client: WebClientType,
  {
    accountType,
    storageMode,
    components,
    scripts,
  }: {
    accountType: AccountType;
    storageMode: AccountStorageMode;
    components: Component[];
    scripts: Script[];
  }
) => {
  const {
    AccountBuilder: WasmAccountBuilder,
    AccountComponent: WasmAccountComponent,
    AccountStorageMode: WasmAccountStorageMode,
    AccountType: WasmAccountType,
    Package: WasmPackage,
    MidenArrays: WasmMidenArrays,
  } = await import("@demox-labs/miden-sdk");
  const builder = client.createScriptBuilder();
  const initSeed = new Uint8Array(32);
  crypto.getRandomValues(initSeed);
  const accountTypes = {
    "fungible-faucet": WasmAccountType.FungibleFaucet,
    "non-fungible-faucet": WasmAccountType.NonFungibleFaucet,
    "regular-account-immutable-code":
      WasmAccountType.RegularAccountImmutableCode,
    "regular-account-updatable-code":
      WasmAccountType.RegularAccountUpdatableCode,
  } as const;
  const accountStorageModes = {
    public: WasmAccountStorageMode.public(),
    network: WasmAccountStorageMode.network(),
    private: WasmAccountStorageMode.private(),
  } as const;
  let accountBuilder = new WasmAccountBuilder(initSeed)
    .accountType(accountTypes[accountType])
    .storageMode(accountStorageModes[storageMode]);
  for (const component of components) {
    if (component.scriptId === "no-auth") {
      accountBuilder = accountBuilder.withNoAuthComponent();
      continue;
    }
    const script = scripts.find(({ id }) => id === component.scriptId);
    if (!script) {
      continue;
    }
    const storageSlots = await Promise.all(
      component.storageSlots.map(wasmStorageSlotFromStorageSlot)
    );
    let accountComponent = script.masm
      ? WasmAccountComponent.compile(script.masm, builder, storageSlots)
      : WasmAccountComponent.fromPackage(
          WasmPackage.deserialize(new Uint8Array(script.packageBytes)),
          new WasmMidenArrays.StorageSlotArray(storageSlots)
        );
    accountComponent = accountComponent.withSupportsAllTypes();
    if (component.type === "auth") {
      accountBuilder = accountBuilder.withAuthComponent(accountComponent);
    } else {
      accountBuilder = accountBuilder.withComponent(accountComponent);
    }
  }
  const { account } = accountBuilder.build();
  await client.newAccount(account, true);
  return account;
};

export const clientCreateNoteFromScript = async ({
  client,
  senderAccountId,
  recipientAccountId,
  type,
  script,
  scripts,
}: {
  client: WebClientType;
  senderAccountId: string;
  recipientAccountId: string;
  type: NoteType;
  script: Script;
  scripts: Script[];
}) => {
  const {
    NoteInputs: WasmNoteInputs,
    FeltArray: WasmFeltArray,
    Word: WasmWord,
    NoteRecipient: WasmNoteRecipient,
    NoteAssets: WasmNoteAssets,
    NoteType: WasmNoteType,
    NoteTag: WasmNoteTag,
    NoteExecutionHint: WasmNoteExecutionHint,
    NoteMetadata: WasmNoteMetadata,
    Note: WasmNote,
    AccountId: WasmAccountId,
  } = await import("@demox-labs/miden-sdk");
  const builder = client.createScriptBuilder();
  const dependencies = script.dependencies
    .map((scriptId) => scripts.find(({ id }) => id === scriptId))
    .filter((dependency) => dependency !== undefined);
  for (const dependency of dependencies) {
    const contractName = dependency.id.replaceAll("-", "_");
    const accountComponentLibrary = builder.buildLibrary(
      `external_contract::${contractName}`,
      dependency.masm
    );
    builder.linkDynamicLibrary(accountComponentLibrary);
  }
  const compiledNoteScript = builder.compileNoteScript(script.masm);
  const noteAssets = new WasmNoteAssets([]);
  const noteTag = WasmNoteTag.fromAccountId(
    WasmAccountId.fromHex(recipientAccountId)
  );
  const noteMetadata = new WasmNoteMetadata(
    WasmAccountId.fromHex(senderAccountId),
    type === "public" ? WasmNoteType.Public : WasmNoteType.Private,
    noteTag,
    //WasmNoteTag.forLocalUseCase(0, 0),
    WasmNoteExecutionHint.none()
  );
  const randomBigUints = new BigUint64Array(4);
  crypto.getRandomValues(randomBigUints);
  const serialNum = new WasmWord(randomBigUints);
  const noteInputs = new WasmNoteInputs(new WasmFeltArray([]));
  const noteRecipient = new WasmNoteRecipient(
    serialNum,
    compiledNoteScript,
    noteInputs
  );
  return new WasmNote(noteAssets, noteMetadata, noteRecipient);
};

const accountType = (account: WasmAccountType) => {
  if (account.isFaucet()) {
    return "fungible-faucet";
  } else if (account.isRegularAccount()) {
    return account.isUpdatable()
      ? "regular-account-updatable-code"
      : "regular-account-immutable-code";
  }
  return "non-fungible-faucet";
};

const storageMode = (account: WasmAccountType) =>
  account.isPublic() ? "public" : account.isNetwork() ? "network" : "private";

const verifyDefaultComponents = async (
  wasmAccount: WasmAccountType,
  scripts: Script[]
) => {
  const { Word: WasmWord } = await import("@demox-labs/miden-sdk");
  const code = wasmAccount.code();
  return scripts
    .filter(
      ({ procedures }) =>
        procedures.length > 0 &&
        procedures.every(({ hash }) =>
          code.hasProcedure(WasmWord.fromHex(hash))
        )
    )
    .map(({ id }) => id);
};

export const wasmAccountToAccount = async ({
  wasmAccount,
  name,
  components,
  networkId,
  updatedAt,
  consumableNoteIds,
  scripts = [],
}: {
  wasmAccount: WasmAccountType;
  name: string;
  components?: string[];
  networkId: string;
  updatedAt: number;
  consumableNoteIds?: string[];
  scripts?: Script[];
}): Promise<Account> => {
  const {
    AccountInterface: WasmAccountInterface,
    BasicFungibleFaucetComponent: WasmBasicFungibleFaucetComponent,
  } = await import("@demox-labs/miden-sdk");
  const code = wasmAccount.code().commitment().toHex();
  const verifiedComponents = components
    ? components
    : await verifyDefaultComponents(wasmAccount, scripts);
  const account: Account = {
    ...defaultAccount(),
    id: wasmAccount.id().toString(),
    name,
    address: wasmAccount
      .id()
      .toBech32Custom(networkId, WasmAccountInterface.BasicWallet),
    type: accountType(wasmAccount),
    storageMode: storageMode(wasmAccount),
    isPublic: wasmAccount.isPublic(),
    isUpdatable: wasmAccount.isUpdatable(),
    isRegularAccount: wasmAccount.isRegularAccount(),
    isNew: wasmAccount.isNew(),
    isFaucet: wasmAccount.isFaucet(),
    nonce: wasmAccount.nonce().asInt(),
    fungibleAssets: wasmAccount
      .vault()
      .fungibleAssets()
      .map((fungibleAsset) => ({
        faucetId: fungibleAsset.faucetId().toString(),
        amount: fungibleAsset.amount().toString(),
      })),
    code,
    storage: range(255).reduce<string[]>((previousValue, currentValue) => {
      const item = wasmAccount.storage().getItem(currentValue);
      return item ? [...previousValue, item.toHex()] : previousValue;
    }, []),
    consumableNoteIds: consumableNoteIds ?? [],
    components: verifiedComponents,
    updatedAt,
  };
  if (wasmAccount.isFaucet()) {
    const basicFungibleFaucetComponent =
      WasmBasicFungibleFaucetComponent.fromAccount(wasmAccount);
    account.symbol = basicFungibleFaucetComponent.symbol().toString();
    account.decimals = basicFungibleFaucetComponent.decimals();
    account.maxSupply = basicFungibleFaucetComponent.maxSupply().toString();
    const [, , , totalSupply] = stringToFeltArray(account.storage[0]!);
    account.totalSupply = totalSupply!.toString();
  }
  return account;
};

const noteType = async (metadata?: WasmNoteMetadataType) => {
  const { NoteType: WasmNoteType } = await import("@demox-labs/miden-sdk");
  const wasmNoteTypes = {
    [WasmNoteType.Public]: "public",
    [WasmNoteType.Private]: "private",
    [WasmNoteType.Encrypted]: "encrypted",
  } as const;
  return metadata ? wasmNoteTypes[metadata.noteType()] : "public";
};

const noteState = async (state: WasmInputNoteStateType) => {
  const { InputNoteState: WasmInputNoteState } = await import(
    "@demox-labs/miden-sdk"
  );
  const wasmInputNoteStates = {
    [WasmInputNoteState.Expected]: "expected",
    [WasmInputNoteState.Unverified]: "unverified",
    [WasmInputNoteState.Committed]: "committed",
    [WasmInputNoteState.Invalid]: "invalid",
    [WasmInputNoteState.ProcessingAuthenticated]: "processing-authenticated",
    [WasmInputNoteState.ProcessingUnauthenticated]:
      "processing-unauthenticated",
    [WasmInputNoteState.ConsumedAuthenticatedLocal]:
      "consumed-authenticated-local",
    [WasmInputNoteState.ConsumedUnauthenticatedLocal]:
      "consumed-unauthenticated-local",
    [WasmInputNoteState.ConsumedExternal]: "consumed-external",
  } as const;
  return wasmInputNoteStates[state];
};

export const wasmInputNoteToInputNote = async (
  record: WasmInputNoteRecordType,
  previousInputNote?: InputNote
): Promise<InputNote> => {
  const [type, state] = await Promise.all([
    noteType(record.metadata()),
    noteState(record.state()),
  ]);
  const scriptRoot = record.details().recipient().script().root().toHex();
  const script = defaultScripts.find(({ root }) => root === scriptRoot);
  return {
    id: record.id().toString(),
    type,
    state,
    tag: record.metadata()?.tag().asU32().toString() ?? "",
    senderId: record.metadata()?.sender().toString() ?? "",
    scriptRoot,
    scriptId: previousInputNote
      ? previousInputNote.scriptId
      : (script?.id ?? ""),
    fungibleAssets: record
      .details()
      .assets()
      .fungibleAssets()
      .map((fungibleAsset) => ({
        faucetId: fungibleAsset.faucetId().toString(),
        amount: fungibleAsset.amount().toString(),
      })),
    inputs: record
      .details()
      .recipient()
      .inputs()
      .values()
      .map((value) => value.toString()),
    nullifier: record.nullifier(),
    updatedAt: record.inclusionProof()?.location().blockNum() ?? 0,
  };
};

const transactionStatus = (transactionRecord: WasmTransactionRecordType) => {
  const status = transactionRecord.transactionStatus();
  if (status.isPending()) {
    return "Pending";
  } else if (status.isCommitted()) {
    return `Committed (Block: ${status.getBlockNum()})`;
  } else {
    return "Discarded";
  }
};

export const wasmTransactionToTransaction = async (
  record: WasmTransactionRecordType,
  result: WasmTransactionResultType
): Promise<Transaction> => {
  const inputNotes = await Promise.all(
    range(result.executedTransaction().inputNotes().numNotes()).map((index) => {
      const note = result.executedTransaction().inputNotes().getNote(index);
      return wasmNoteToNote(note.note());
    })
  );
  const outputNotes = await Promise.all(
    range(result.executedTransaction().outputNotes().numNotes())
      .map((index) => {
        const note = result.executedTransaction().outputNotes().getNote(index);
        return note.intoFull();
      })
      .filter((note) => note !== undefined)
      .map((note) => wasmNoteToNote(note))
  );
  return {
    id: record.id().toHex(),
    status: transactionStatus(record),
    accountId: record.accountId().toString(),
    scriptRoot:
      result.executedTransaction().txArgs().txScript()?.root().toHex() ?? "",
    inputNotes,
    outputNotes,
    updatedAt: record.blockNum(),
  };
};

export const wasmNoteToNote = async (
  note: WasmNoteType
): Promise<TransactionNote> => ({
  id: note.id().toString(),
  type: await noteType(note.metadata()),
  scriptRoot: note.recipient().script().root().toHex(),
  senderId: note.metadata()?.sender().toString() ?? "",
  fungibleAssets: note
    .assets()
    .fungibleAssets()
    .map((fungibleAsset) => ({
      faucetId: fungibleAsset.faucetId().toString(),
      amount: fungibleAsset.amount().toString(),
    })),
});

export const wasmStorageSlotFromStorageSlot = async (
  storageSlot: StorageSlot
) => {
  const { StorageSlot, StorageMap } = await import("@demox-labs/miden-sdk");
  if (storageSlot.type === "value") {
    return StorageSlot.fromValue(await bigintToWord(BigInt(storageSlot.value)));
  } else {
    const storageMap = new StorageMap();
    const keyValuePairs = storageSlot.value.split(",");
    for (const keyValuePair of keyValuePairs) {
      const [key, value] = keyValuePair.split(":");
      storageMap.insert(
        await bigintToWord(BigInt(key!)),
        await bigintToWord(BigInt(value!))
      );
    }
    return StorageSlot.map(storageMap);
  }
};
