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
// import { type NetworkId } from "@/lib/types/network";
import { type InputNote, type NoteType } from "@/lib/types/note";
import {
  type TransactionNote,
  type Transaction,
} from "@/lib/types/transaction";
import { type Script, type Export } from "@/lib/types/script";
import { type StorageSlot, type Component } from "@/lib/types/component";
import defaultScripts from "@/lib/types/default-scripts";
import getterScript from "@/lib/types/default-scripts/getter";
import noAuth from "@/lib/types/default-components/no-auth";
import getterComponent from "@/lib/types/default-components/getter";
import { stringToFeltArray } from "@/lib/utils";
import { fromHex } from "viem";
import type { MidenSdk } from "@/lib/types";

// const globalForWebClient = globalThis as unknown as {
//   webClient: WebClientType;
// };

// export const webClient = async (
//   networkId: NetworkId,
//   serializedMockChain: Uint8Array | null
// ) => {
//   if (networkId === "mlcl") {
//     // @ts-expect-error MockWebClient not exported
//     const { MockWebClient } = await import("@demox-labs/miden-sdk");
//     return MockWebClient.createClient(serializedMockChain) as WebClientType;
//   }
//   const { WebClient } = await import("@demox-labs/miden-sdk");
//   if (!globalForWebClient.webClient) {
//     globalForWebClient.webClient = await WebClient.createClient();
//   }
//   return globalForWebClient.webClient;
// };

const bigintToWord = ({
  value,
  midenSdk: { Word },
}: {
  value: bigint;
  midenSdk: MidenSdk;
}) =>
  new Word(
    BigUint64Array.from(
      BigInt(value)
        .toString(16)
        .padStart(64, "0")
        .match(/.{1,16}/g)!
        .map((chunk) => BigInt(`0x${chunk}`))
    )
  );

export const clientNewWallet = ({
  client,
  storageMode,
  mutable,
  initSeed,
  midenSdk: { AccountStorageMode },
}: {
  client: WebClientType;
  storageMode: AccountStorageMode;
  mutable: boolean;
  initSeed?: Uint8Array;
  midenSdk: MidenSdk;
}) =>
  client.newWallet(
    storageMode === "public"
      ? AccountStorageMode.public()
      : AccountStorageMode.private(),
    mutable,
    0,
    initSeed
  );

export const clientNewFaucet = ({
  client,
  storageMode,
  nonFungible,
  tokenSymbol,
  decimals,
  maxSupply,
  midenSdk: { AccountStorageMode },
}: {
  client: WebClientType;
  storageMode: AccountStorageMode;
  nonFungible: boolean;
  tokenSymbol: string;
  decimals: number;
  maxSupply: bigint;
  midenSdk: MidenSdk;
}) =>
  client.newFaucet(
    storageMode === "public"
      ? AccountStorageMode.public()
      : AccountStorageMode.private(),
    nonFungible,
    tokenSymbol,
    decimals,
    maxSupply,
    0
  );

export const clientExecuteTransaction = async ({
  client,
  accountId,
  transactionRequest,
  midenSdk: { AccountId },
}: {
  client: WebClientType;
  accountId: string;
  transactionRequest: WasmTransactionRequestType;
  midenSdk: MidenSdk;
}) =>
  client.executeTransaction(AccountId.fromHex(accountId), transactionRequest);

export const clientNewMintTransactionRequest = ({
  client,
  targetAccountId,
  faucetId,
  noteType,
  amount,
  midenSdk: { AccountId, NoteType },
}: {
  client: WebClientType;
  targetAccountId: string;
  faucetId: string;
  noteType: NoteType;
  amount: bigint;
  midenSdk: MidenSdk;
}) => {
  const wasmNoteTypes = {
    public: NoteType.Public,
    private: NoteType.Private,
    encrypted: NoteType.Encrypted,
  } as const;
  return client.newMintTransactionRequest(
    AccountId.fromHex(targetAccountId),
    AccountId.fromHex(faucetId),
    wasmNoteTypes[noteType],
    amount
  );
};

export const clientNewConsumeTransactionRequest = ({
  client,
  noteIds,
}: {
  client: WebClientType;
  noteIds: string[];
}) => client.newConsumeTransactionRequest(noteIds);

export const clientNewSendTransactionRequest = ({
  client,
  senderAccountId,
  targetAccountId,
  faucetId,
  noteType,
  amount,
  midenSdk: { AccountId, NoteType },
}: {
  client: WebClientType;
  senderAccountId: string;
  targetAccountId: string;
  faucetId: string;
  noteType: NoteType;
  amount: bigint;
  midenSdk: MidenSdk;
}) => {
  const wasmNoteTypes = {
    public: NoteType.Public,
    private: NoteType.Private,
    encrypted: NoteType.Encrypted,
  } as const;
  return client.newSendTransactionRequest(
    AccountId.fromHex(senderAccountId),
    AccountId.fromHex(targetAccountId),
    AccountId.fromHex(faucetId),
    wasmNoteTypes[noteType],
    amount
  );
};

export const clientSubmitNewTransaction = ({
  client,
  accountId,
  transactionRequest,
  midenSdk: { AccountId },
}: {
  client: WebClientType;
  accountId: string;
  transactionRequest: WasmTransactionRequestType;
  midenSdk: MidenSdk;
}) =>
  client.submitNewTransaction(AccountId.fromHex(accountId), transactionRequest);

export const clientGetAccountById = async ({
  client,
  accountId,
  midenSdk: { AccountId },
}: {
  client: WebClientType;
  accountId: string;
  midenSdk: MidenSdk;
}) => {
  const wasmAccountId = AccountId.fromHex(accountId);
  const account = await client.getAccount(wasmAccountId);
  if (account) {
    return account;
  }
  await client.importAccountById(wasmAccountId);
  await client.syncState();
  const importedAccount = await client.getAccount(wasmAccountId);
  if (!importedAccount) {
    throw new Error("Error importing account");
  }
  return importedAccount;
};

export const clientGetAccountByAddress = ({
  client,
  address,
  midenSdk,
}: {
  client: WebClientType;
  address: string;
  midenSdk: MidenSdk;
}) => {
  const { Address } = midenSdk;
  const accountId = Address.fromBech32(address).accountId().toString();
  return clientGetAccountById({ client, accountId, midenSdk });
};

export const clientGetConsumableNotes = ({
  client,
  accountId,
  midenSdk: { AccountId },
}: {
  client: WebClientType;
  accountId: string;
  midenSdk: MidenSdk;
}) => client.getConsumableNotes(AccountId.fromHex(accountId));

export const clientGetAllInputNotes = async ({
  client,
  previousInputNotes,
  midenSdk,
}: {
  client: WebClientType;
  previousInputNotes: InputNote[];
  midenSdk: MidenSdk;
}) => {
  const { NoteFilter, NoteFilterTypes, RpcClient, Endpoint } = midenSdk;
  const wasmInputNotes = await client.getInputNotes(
    new NoteFilter(NoteFilterTypes.All)
  );
  if (client.usesMockChain()) {
    return wasmInputNotes.map((wasmInputNote) =>
      wasmInputNoteToInputNote({
        record: wasmInputNote,
        previousInputNote: previousInputNotes.find(
          ({ id }) => id === wasmInputNote.id().toString()
        ),
        midenSdk,
      })
    );
  } else {
    const rpcClient = new RpcClient(Endpoint.testnet());
    const wasmFetchedNotes = await rpcClient.getNotesById(
      wasmInputNotes.map((wasmInputNote) => wasmInputNote.id())
    );
    const patchedWasmInputNotes = wasmInputNotes.map((wasmInputNote, index) => {
      wasmInputNote.metadata = () => wasmFetchedNotes[index]?.metadata;
      return wasmInputNote;
    });
    return Promise.all(
      patchedWasmInputNotes.map((wasmInputNote) =>
        wasmInputNoteToInputNote({
          record: wasmInputNote,
          previousInputNote: previousInputNotes.find(
            ({ id }) => id === wasmInputNote.id().toString()
          ),
          midenSdk,
        })
      )
    );
  }
};

export const clientGetTransactionsByIds = ({
  client,
  transactionIds,
  midenSdk: { TransactionFilter },
}: {
  client: WebClientType;
  transactionIds: WasmTransactionIdType[];
  midenSdk: MidenSdk;
}): Promise<WasmTransactionRecordType[]> =>
  client.getTransactions(TransactionFilter.ids(transactionIds));

export const clientImportNewWallet = async ({
  client,
  address,
  midenSdk: { Account, Address },
}: {
  client: WebClientType;
  address: string;
  midenSdk: MidenSdk;
}) => {
  const accountId = Address.fromBech32(address).accountId();
  const serializedImportedWallet = Uint8Array.from([
    ...fromHex(accountId.toString() as `0x${string}`, "bytes"),
    ...newWallet.slice(15),
  ]);
  try {
    await client.newAccount(
      Account.deserialize(serializedImportedWallet),
      true
    );
    //  eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    //
  }
};

const invokeGetterCustomTransactionScript = ({
  accountIdPrefix,
  accountIdSuffix,
  procHash,
}: {
  accountIdPrefix: string;
  accountIdSuffix: string;
  procHash: string;
}) => `use.external_contract::getter
use.std::sys

begin
    push.${procHash}
    push.${accountIdSuffix}
    push.${accountIdPrefix}
    call.getter::read_word
    exec.sys::truncate_stack
end
`;

export const clientReadWord = async ({
  client,
  accountId,
  procedureExport,
  midenSdk,
}: {
  client: WebClientType;
  accountId: string;
  procedureExport: Export;
  midenSdk: MidenSdk;
}) => {
  const {
    TransactionRequestBuilder,
    MidenArrays,
    AccountStorageRequirements,
    AccountId,
    ForeignAccount,
  } = midenSdk;
  const getterAccount = await clientDeployAccount({
    client,
    accountType: "regular-account-updatable-code",
    storageMode: "public",
    components: [noAuth, getterComponent],
    scripts: [getterScript],
    midenSdk,
  });
  const builder = client.createScriptBuilder();
  const accountComponentLibrary = builder.buildLibrary(
    "external_contract::getter",
    getterScript.masm
  );
  builder.linkDynamicLibrary(accountComponentLibrary);
  const wasmAccountId = AccountId.fromHex(accountId);
  const transactionScript = builder.compileTxScript(
    invokeGetterCustomTransactionScript({
      accountIdPrefix: wasmAccountId.prefix().toString(),
      accountIdSuffix: wasmAccountId.suffix().toString(),
      procHash: procedureExport.digest,
    })
  );
  const transactionRequest = new TransactionRequestBuilder()
    .withCustomScript(transactionScript)
    .withForeignAccounts(
      new MidenArrays.ForeignAccountArray([
        ForeignAccount.public(
          AccountId.fromHex(accountId),
          new AccountStorageRequirements()
        ),
      ])
    )
    .build();
  const transactionResult = await clientExecuteTransaction({
    client,
    accountId: getterAccount.id().toString(),
    transactionRequest,
    midenSdk,
  });
  const accountDelta = transactionResult.executedTransaction().accountDelta();
  const [word = bigintToWord({ value: 0n, midenSdk })] = accountDelta
    .storage()
    .values();
  return word;
};

export const clientDeployAccount = async ({
  client,
  accountType,
  storageMode,
  components,
  scripts,
  midenSdk,
}: {
  client: WebClientType;
  accountType: AccountType;
  storageMode: AccountStorageMode;
  components: Component[];
  scripts: Script[];
  midenSdk: MidenSdk;
}) => {
  const {
    AccountBuilder,
    AccountComponent,
    AccountStorageMode,
    AccountType,
    Package,
    MidenArrays,
  } = midenSdk;
  const builder = client.createScriptBuilder();
  const initSeed = new Uint8Array(32);
  crypto.getRandomValues(initSeed);
  const accountTypes = {
    "fungible-faucet": AccountType.FungibleFaucet,
    "non-fungible-faucet": AccountType.NonFungibleFaucet,
    "regular-account-immutable-code": AccountType.RegularAccountImmutableCode,
    "regular-account-updatable-code": AccountType.RegularAccountUpdatableCode,
  } as const;
  const accountStorageModes = {
    public: AccountStorageMode.public(),
    network: AccountStorageMode.network(),
    private: AccountStorageMode.private(),
  } as const;
  let accountBuilder = new AccountBuilder(initSeed)
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
    const storageSlots = component.storageSlots.map((storageSlot) =>
      wasmStorageSlotFromStorageSlot({ storageSlot, midenSdk })
    );
    let accountComponent = script.masm
      ? AccountComponent.compile(script.masm, builder, storageSlots)
      : AccountComponent.fromPackage(
          Package.deserialize(new Uint8Array(script.packageBytes)),
          new MidenArrays.StorageSlotArray(storageSlots)
        );
    // const procs = accountComponent.getProcedures();
    // for (const proc of procs) {
    //   console.log(proc.digest.toHex());
    // }
    // if (script.id === "basic-fungible-faucet") {
    //   console.log(
    //     "distribute",
    //     accountComponent.getProcedureHash("distribute")
    //   );
    //   console.log("burn", accountComponent.getProcedureHash("burn"));
    // }
    accountComponent = accountComponent.withSupportsAllTypes();
    if (component.type === "authentication-component") {
      accountBuilder = accountBuilder.withAuthComponent(accountComponent);
    } else {
      accountBuilder = accountBuilder.withComponent(accountComponent);
    }
  }
  const { account } = accountBuilder.build();
  await client.newAccount(account, true);
  return account;
};

export const clientCreateTransactionFromScript = ({
  script,
  midenSdk: { Package, TransactionScript, TransactionRequestBuilder },
}: {
  script: Script;
  midenSdk: MidenSdk;
}) => {
  const transactionScript = TransactionScript.fromPackage(
    Package.deserialize(new Uint8Array(script.packageBytes))
  );
  const transactionRequestBuilder =
    new TransactionRequestBuilder().withCustomScript(transactionScript);
  return transactionRequestBuilder.build();
};

const clientCreateNoteScriptFromMasm = ({
  client,
  script,
  scripts,
}: {
  client: WebClientType;
  script: Script;
  scripts: Script[];
}) => {
  const builder = client.createScriptBuilder();
  const dependencies = script.dependencies
    .map((dependency) => scripts.find(({ id }) => id === dependency.id))
    .filter((dependency) => dependency?.masm)
    .filter((dependency) => dependency !== undefined);
  for (const dependency of dependencies) {
    const contractName = dependency.name.replaceAll("-", "_");
    const accountComponentLibrary = builder.buildLibrary(
      `external_contract::${contractName}`,
      dependency.masm
    );
    builder.linkDynamicLibrary(accountComponentLibrary);
  }
  return builder.compileNoteScript(script.masm);
};

const clientCreateNoteScriptFromPackage = ({
  script,
  midenSdk: { NoteScript, Package },
}: {
  script: Script;
  midenSdk: MidenSdk;
}) =>
  NoteScript.fromPackage(
    Package.deserialize(new Uint8Array(script.packageBytes))
  );

export const clientCreateNoteFromScript = ({
  client,
  senderAccountId,
  recipientAccountId,
  script,
  type,
  faucetAccountId,
  amount,
  noteInputs,
  scripts,
  midenSdk,
}: {
  client: WebClientType;
  senderAccountId: string;
  recipientAccountId: string;
  script: Script;
  type: NoteType;
  faucetAccountId: string;
  amount: bigint;
  noteInputs: string[];
  scripts: Script[];
  midenSdk: MidenSdk;
}) => {
  const {
    NoteInputs,
    FeltArray,
    Felt,
    Word,
    NoteRecipient,
    NoteAssets,
    FungibleAsset,
    NoteType,
    NoteTag,
    NoteExecutionHint,
    NoteMetadata,
    Note,
    AccountId,
  } = midenSdk;
  const noteScript = script.masm
    ? clientCreateNoteScriptFromMasm({ client, script, scripts })
    : clientCreateNoteScriptFromPackage({ script, midenSdk });
  const assets = new NoteAssets(
    faucetAccountId
      ? [new FungibleAsset(AccountId.fromHex(faucetAccountId), amount)]
      : []
  );
  const metadata = new NoteMetadata(
    AccountId.fromHex(senderAccountId),
    type === "public" ? NoteType.Public : NoteType.Private,
    NoteTag.fromAccountId(AccountId.fromHex(recipientAccountId)),
    NoteExecutionHint.none()
  );
  const randomBigUints = new BigUint64Array(4);
  crypto.getRandomValues(randomBigUints);
  const serialNum = new Word(randomBigUints);
  const inputs = new NoteInputs(
    new FeltArray(noteInputs.map((noteInput) => new Felt(BigInt(noteInput))))
  );
  const recipient = new NoteRecipient(serialNum, noteScript, inputs);
  return new Note(assets, metadata, recipient);
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

const verifyDefaultComponents = ({
  wasmAccount,
  // scripts,
  midenSdk: { Word },
}: {
  wasmAccount: WasmAccountType;
  // scripts: Script[];
  midenSdk: MidenSdk;
}) => {
  const code = wasmAccount.code();
  return defaultScripts
    .filter(
      ({ exports }) =>
        exports.length > 0 &&
        exports.every(({ digest }) => code.hasProcedure(Word.fromHex(digest)))
    )
    .map(({ id }) => id);
};

export const wasmAccountToAccount = ({
  wasmAccount,
  name,
  components,
  networkId,
  updatedAt,
  consumableNoteIds,
  // scripts = [],
  midenSdk,
}: {
  wasmAccount: WasmAccountType;
  name: string;
  components?: string[];
  networkId: string;
  updatedAt: number;
  consumableNoteIds?: string[];
  // scripts?: Script[];
  midenSdk: MidenSdk;
}): Account => {
  const { AccountInterface, BasicFungibleFaucetComponent } = midenSdk;
  const code = wasmAccount.code().commitment().toHex();
  const verifiedComponents = components
    ? components
    : verifyDefaultComponents({ wasmAccount, /*scripts,*/ midenSdk });
  const account: Account = {
    ...defaultAccount(),
    id: wasmAccount.id().toString(),
    name,
    address: wasmAccount
      .id()
      .toBech32Custom(networkId, AccountInterface.BasicWallet),
    type: accountType(wasmAccount),
    storageMode: storageMode(wasmAccount),
    isPublic: wasmAccount.isPublic(),
    isUpdatable: wasmAccount.isUpdatable(),
    isRegularAccount: wasmAccount.isRegularAccount(),
    isNew: wasmAccount.isNew(),
    isFaucet: wasmAccount.isFaucet(),
    nonce: Number(wasmAccount.nonce().asInt()),
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
      BasicFungibleFaucetComponent.fromAccount(wasmAccount);
    account.symbol = basicFungibleFaucetComponent.symbol().toString();
    account.decimals = basicFungibleFaucetComponent.decimals();
    account.maxSupply = basicFungibleFaucetComponent.maxSupply().toString();
    const [, , , totalSupply] = stringToFeltArray(account.storage[0]!);
    account.totalSupply = totalSupply!.toString();
  }
  return account;
};

const noteType = ({
  metadata,
  midenSdk: { NoteType },
}: {
  metadata?: WasmNoteMetadataType;
  midenSdk: MidenSdk;
}) => {
  const wasmNoteTypes = {
    [NoteType.Public]: "public",
    [NoteType.Private]: "private",
    [NoteType.Encrypted]: "encrypted",
  } as const;
  return metadata ? wasmNoteTypes[metadata.noteType()] : "public";
};

const noteState = ({
  state,
  midenSdk: { InputNoteState },
}: {
  state: WasmInputNoteStateType;
  midenSdk: MidenSdk;
}) => {
  const wasmInputNoteStates = {
    [InputNoteState.Expected]: "expected",
    [InputNoteState.Unverified]: "unverified",
    [InputNoteState.Committed]: "committed",
    [InputNoteState.Invalid]: "invalid",
    [InputNoteState.ProcessingAuthenticated]: "processing-authenticated",
    [InputNoteState.ProcessingUnauthenticated]: "processing-unauthenticated",
    [InputNoteState.ConsumedAuthenticatedLocal]: "consumed-authenticated-local",
    [InputNoteState.ConsumedUnauthenticatedLocal]:
      "consumed-unauthenticated-local",
    [InputNoteState.ConsumedExternal]: "consumed-external",
  } as const;
  return wasmInputNoteStates[state];
};

export const wasmInputNoteToInputNote = ({
  record,
  previousInputNote,
  midenSdk,
}: {
  record: WasmInputNoteRecordType;
  previousInputNote?: InputNote;
  midenSdk: MidenSdk;
}): InputNote => {
  const scriptRoot = record.details().recipient().script().root().toHex();
  const script = defaultScripts.find(({ root }) => root === scriptRoot);
  return {
    id: record.id().toString(),
    type: noteType({ metadata: record.metadata(), midenSdk }),
    state: noteState({ state: record.state(), midenSdk }),
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

export const wasmTransactionToTransaction = ({
  record,
  result,
  midenSdk,
}: {
  record: WasmTransactionRecordType;
  result: WasmTransactionResultType;
  midenSdk: MidenSdk;
}): Transaction => {
  const inputNotes = range(
    result.executedTransaction().inputNotes().numNotes()
  ).map((index) => {
    const note = result.executedTransaction().inputNotes().getNote(index);
    return wasmNoteToNote({ note: note.note(), midenSdk });
  });
  const outputNotes = range(
    result.executedTransaction().outputNotes().numNotes()
  )
    .map((index) => {
      const note = result.executedTransaction().outputNotes().getNote(index);
      return note.intoFull();
    })
    .filter((note) => note !== undefined)
    .map((note) => wasmNoteToNote({ note, midenSdk }));
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

export const wasmNoteToNote = ({
  note,
  midenSdk,
}: {
  note: WasmNoteType;
  midenSdk: MidenSdk;
}): TransactionNote => ({
  id: note.id().toString(),
  type: noteType({ metadata: note.metadata(), midenSdk }),
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

export const wasmStorageSlotFromStorageSlot = ({
  storageSlot,
  midenSdk,
}: {
  storageSlot: StorageSlot;
  midenSdk: MidenSdk;
}) => {
  const { StorageSlot, StorageMap } = midenSdk;
  if (storageSlot.type === "value") {
    return StorageSlot.fromValue(
      bigintToWord({ value: BigInt(storageSlot.value), midenSdk })
    );
  } else {
    const storageMap = new StorageMap();
    const keyValuePairs = storageSlot.value.split(",");
    for (const keyValuePair of keyValuePairs) {
      const [key = "", value = ""] = keyValuePair.split(":");
      storageMap.insert(
        bigintToWord({ value: BigInt(key), midenSdk }),
        bigintToWord({ value: BigInt(value), midenSdk })
      );
    }
    return StorageSlot.map(storageMap);
  }
};
