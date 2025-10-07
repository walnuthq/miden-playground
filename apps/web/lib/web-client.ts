import { range } from "lodash";
import {
  type Account as WasmAccount,
  type WebClient as WebClientType,
  type InputNoteRecord as WasmInputNoteRecord,
  type NoteMetadata as WasmNoteMetadata,
  type Note as WasmNote,
  // type TransactionRecord as WasmTransactionRecord,
  type TransactionResult as WasmTransactionResult,
  type TransactionRequest as WasmTransactionRequest,
  type InputNoteState as WasmInputNoteStateType,
} from "@demox-labs/miden-sdk";
import {
  type WasmTransactionId,
  type WasmTransactionRecord,
} from "@/lib/types";
import {
  type Account,
  type AccountStorageMode,
  type AccountType,
} from "@/lib/types/account";
import { type NetworkId } from "@/lib/types/network";
import { type InputNote, type NoteType } from "@/lib/types/note";
import {
  type TransactionNote,
  type Transaction,
} from "@/lib/types/transaction";
import { type Script } from "@/lib/types/script";
import { type StorageSlot, type Component } from "@/lib/types/component";
import { BASIC_WALLET_CODE } from "@/lib/constants";

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
  }: { storageMode: AccountStorageMode; mutable: boolean }
) => {
  const { AccountStorageMode: WasmAccountStorageMode } = await import(
    "@demox-labs/miden-sdk"
  );
  return client.newWallet(
    storageMode === "public"
      ? WasmAccountStorageMode.public()
      : WasmAccountStorageMode.private(),
    mutable
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
    maxSupply
  );
};

export const clientNewAccount = async (
  client: WebClientType,
  {
    account,
    accountSeed,
    overwrite,
  }: { account: WasmAccount; accountSeed: bigint; overwrite: boolean }
) => {
  return client.newAccount(account, await bigintToWord(accountSeed), overwrite);
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

export const clientNewTransaction = async (
  client: WebClientType,
  {
    accountId,
    transactionRequest,
  }: { accountId: string; transactionRequest: WasmTransactionRequest }
) => {
  const { AccountId: WasmAccountId } = await import("@demox-labs/miden-sdk");
  return client.newTransaction(
    WasmAccountId.fromHex(accountId),
    transactionRequest
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

export const clientGetAllInputNotes = async (client: WebClientType) => {
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
        wasmInputNoteToInputNote(wasmInputNote)
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
        wasmInputNoteToInputNote(wasmInputNote)
      )
    );
  }
};

export const clientGetTransactionsByIds = async (
  client: WebClientType,
  transactionIds: WasmTransactionId[]
): Promise<WasmTransactionRecord[]> => {
  const { TransactionFilter: WasmTransactionFilter } = await import(
    "@demox-labs/miden-sdk"
  );
  return client.getTransactions(WasmTransactionFilter.ids(transactionIds));
};

export const clientImportNewWallet = async (
  client: WebClientType,
  address: string
) => {
  const wallet = await clientNewWallet(client, {
    storageMode: "public",
    mutable: true,
  });
  const serializedWallet = wallet.serialize();
  const fromHexString = (hexString: string) => {
    const chunks = hexString.match(/.{1,2}/g)!;
    return Uint8Array.from(chunks.map((byte) => Number.parseInt(byte, 16)));
  };
  const { Account: WasmAccount, Address: WasmAddress } = await import(
    "@demox-labs/miden-sdk"
  );
  const accountId = WasmAddress.fromBech32(address).accountId();
  const serializedImportedWallet = Uint8Array.from([
    ...fromHexString(accountId.toString().slice(2)),
    ...serializedWallet.slice(15),
  ]);
  await clientNewAccount(client, {
    account: WasmAccount.deserialize(serializedImportedWallet),
    accountSeed: 0n,
    overwrite: true,
  });
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
    TransactionKernel: WasmTransactionKernel,
    AccountBuilder: WasmAccountBuilder,
    AccountComponent: WasmAccountComponent,
    AccountStorageMode: WasmAccountStorageMode,
    AccountType: WasmAccountType,
  } = await import("@demox-labs/miden-sdk");
  const assembler = WasmTransactionKernel.assembler();
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
  let accountBuilder = new WasmAccountBuilder(initSeed)
    .accountType(accountTypes[accountType])
    .storageMode(
      storageMode === "public"
        ? WasmAccountStorageMode.public()
        : WasmAccountStorageMode.private()
    );
  for (const component of components) {
    const script = scripts.find(({ id }) => id === component.scriptId);
    if (!script) {
      continue;
    }
    const storageSlots = await Promise.all(
      component.storageSlots.map(wasmStorageSlotFromStorageSlot)
    );
    const compiledComponent = WasmAccountComponent.compile(
      script.masm,
      assembler,
      storageSlots
    ).withSupportsAllTypes();
    if (component.type === "auth") {
      accountBuilder = accountBuilder.withAuthComponent(compiledComponent);
    } else {
      accountBuilder = accountBuilder.withComponent(compiledComponent);
    }
  }
  const { account, seed } = accountBuilder.build();
  await client.newAccount(account, seed, true);
  return account;
};

export const createNoteFromScript = async ({
  senderAccountId,
  recipientAccountId,
  type,
  script,
  scripts,
}: {
  senderAccountId: string;
  recipientAccountId: string;
  type: NoteType;
  script: Script;
  scripts: Script[];
}) => {
  const {
    TransactionKernel: WasmTransactionKernel,
    AssemblerUtils: WasmAssemblerUtils,
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
    // FungibleAsset: WasmFungibleAsset,
  } = await import("@demox-labs/miden-sdk");
  let assembler = WasmTransactionKernel.assembler().withDebugMode(true);
  const dependencies = script.dependencies
    .map((scriptId) => scripts.find(({ id }) => id === scriptId))
    .filter((dependency) => dependency !== undefined);
  console.log(dependencies);
  for (const dependency of dependencies) {
    const contractName = dependency.id.replaceAll("-", "_");
    const accountComponentLibrary =
      WasmAssemblerUtils.createAccountComponentLibrary(
        assembler,
        `external_contract::${contractName}`,
        dependency.masm
      );
    assembler = assembler.withLibrary(accountComponentLibrary);
  }
  // const accountComponents = senderAccount.components
  //   .map((componentId) => components.find(({ id }) => id === componentId))
  //   .filter((component) => component !== undefined)
  //   // TODO
  //   .filter(({ id }) => id === "counter-contract");
  // console.log("components", accountComponents);
  // for (const component of accountComponents) {
  //   const componentScript = scripts.find(({ id }) => id === component.scriptId);
  //   if (!componentScript) {
  //     throw new Error("Script not found");
  //   }
  //   const contractName = componentScript.id.replaceAll("-", "_");
  //   console.log("contractName", contractName);
  //   const accountComponentLibrary =
  //     WasmAssemblerUtils.createAccountComponentLibrary(
  //       assembler,
  //       `external_contract::${contractName}`,
  //       componentScript.masm
  //     );
  //   assembler = assembler.withLibrary(accountComponentLibrary);
  // }
  console.log(script.masm);
  const compiledNoteScript = assembler.compileNoteScript(script.masm);
  console.log("OK");
  const noteAssets = new WasmNoteAssets([]);
  // const noteAssets = new WasmNoteAssets([
  //   new WasmFungibleAsset(
  //     WasmAccountId.fromHex("0x83592005c13d47203ec1e3124c654d"),
  //     100n
  //   ),
  // ]);
  const noteMetadata = new WasmNoteMetadata(
    WasmAccountId.fromHex(senderAccountId),
    type === "public" ? WasmNoteType.Public : WasmNoteType.Private,
    WasmNoteTag.fromAccountId(WasmAccountId.fromHex(recipientAccountId)),
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

/* export const createAccountComponentLibrary = async (script: Script) => {
  const {
    TransactionKernel: WasmTransactionKernel,
    AssemblerUtils: WasmAssemblerUtils,
  } = await import("@demox-labs/miden-sdk");
  const assembler = WasmTransactionKernel.assembler();
  const contractName = script.id.replaceAll("-", "_");
  return WasmAssemblerUtils.createAccountComponentLibrary(
    assembler,
    `external_contract::${contractName}`,
    script.masm
  );
}; */

const accountType = (account: WasmAccount /*, tokenSymbol?: string*/) => {
  if (account.isFaucet()) {
    return "fungible-faucet";
  } else if (account.isRegularAccount()) {
    return account.isUpdatable()
      ? "regular-account-updatable-code"
      : "regular-account-immutable-code";
  }
  return "non-fungible-faucet";
};

export const wasmAccountToAccount = async ({
  wasmAccount,
  name,
  tokenSymbol,
  components,
  networkId,
  updatedAt,
  consumableNoteIds,
}: {
  wasmAccount: WasmAccount;
  name: string;
  tokenSymbol?: string;
  components?: string[];
  networkId: string;
  updatedAt: number;
  consumableNoteIds?: string[];
}): Promise<Account> => {
  const { AccountInterface: WasmAccountInterface } = await import(
    "@demox-labs/miden-sdk"
  );
  const code = wasmAccount.code().commitment().toHex();
  return {
    id: wasmAccount.id().toString(),
    name,
    address: wasmAccount
      .id()
      .toBech32Custom(networkId, WasmAccountInterface.Unspecified),
    type: accountType(wasmAccount /*, tokenSymbol*/),
    storageMode: wasmAccount.isPublic() ? "public" : "private",
    isPublic: wasmAccount.isPublic(),
    isUpdatable: wasmAccount.isUpdatable(),
    isRegularAccount: wasmAccount.isRegularAccount(),
    isNew: wasmAccount.isNew(),
    isWallet: code === BASIC_WALLET_CODE,
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
    components: components ?? [],
    tokenSymbol,
    updatedAt,
  };
};

const noteType = async (metadata?: WasmNoteMetadata) => {
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
  record: WasmInputNoteRecord
): Promise<InputNote> => ({
  id: record.id().toString(),
  type: await noteType(record.metadata()),
  state: await noteState(record.state()),
  tag: record.metadata()?.tag().asU32().toString() ?? "",
  senderId: record.metadata()?.sender().toString() ?? "",
  scriptRoot: record.details().recipient().script().root().toHex(),
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
    .map((value) => value.asInt()),
  nullifier: record.nullifier(),
  updatedAt: record.inclusionProof()?.location().blockNum() ?? 0,
});

const transactionStatus = (transactionRecord: WasmTransactionRecord) => {
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
  record: WasmTransactionRecord,
  result: WasmTransactionResult
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
    scriptRoot: result.transactionArguments().txScript()?.root().toHex() ?? "",
    inputNotes,
    outputNotes,
    updatedAt: record.blockNum(),
  };
};

export const wasmNoteToNote = async (
  note: WasmNote
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
