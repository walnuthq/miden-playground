import { range } from "lodash";
import {
  type Account as WasmAccountType,
  type AccountId as WasmAccountIdType,
  type WebClient as WebClientType,
  type InputNoteRecord as WasmInputNoteRecordType,
  type NoteMetadata as WasmNoteMetadataType,
  type Note as WasmNoteType,
  type TransactionResult as WasmTransactionResultType,
  type InputNoteState as WasmInputNoteStateType,
  type TransactionId as WasmTransactionIdType,
  type TransactionRequest as WasmTransactionRequestType,
  type TransactionRecord as WasmTransactionRecordType,
} from "@miden-sdk/miden-sdk";
import {
  type Account,
  type AccountStorageMode,
  type AccountType,
  type StorageItem,
  defaultAccount,
  getIdentifierPart,
  getItem,
  getRoutingParametersPart,
} from "@/lib/types/account";
import { type InputNote, type NoteType } from "@/lib/types/note";
import {
  type TransactionNote,
  type Transaction,
} from "@/lib/types/transaction";
import { type Script, type ProcedureExport } from "@/lib/types/script";
import { type StorageSlot, type Component } from "@/lib/types/component";
import defaultScripts from "@/lib/types/default-scripts";
import getterScript from "@/lib/types/default-scripts/getter";
import noAuth from "@/lib/types/default-components/no-auth";
import getterComponent from "@/lib/types/default-components/getter";
import { stringToFeltArray, fromBase64 } from "@/lib/utils";
import type { MidenSdk } from "@/lib/types";
import type { NetworkId } from "@/lib/types/network";

export const bigintToWord = ({
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
        .map((chunk) => BigInt(`0x${chunk}`)),
    ),
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
    initSeed,
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
    0,
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
    amount,
  );
};

export const clientNewConsumeTransactionRequest = async ({
  client,
  noteIds,
}: {
  client: WebClientType;
  noteIds: string[];
}) => {
  const wasmInputNoteRecords = await Promise.all(
    noteIds.map((noteId) => client.getInputNote(noteId)),
  );
  const notes = wasmInputNoteRecords
    .filter((inputNoteRecord) => inputNoteRecord !== undefined)
    .map((inputNoteRecord) => inputNoteRecord.toNote());
  return client.newConsumeTransactionRequest(notes);
};

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
    amount,
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
  const accountId = addressToAccountId({ address, midenSdk }).toString();
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
  networkId,
  previousInputNotes,
  scripts,
  midenSdk,
}: {
  client: WebClientType;
  networkId: NetworkId;
  previousInputNotes: InputNote[];
  scripts: Script[];
  midenSdk: MidenSdk;
}) => {
  const { NoteFilter, NoteFilterTypes, RpcClient, Endpoint } = midenSdk;
  const wasmInputNotes = await client.getInputNotes(
    new NoteFilter(NoteFilterTypes.All),
  );
  if (client.usesMockChain()) {
    return wasmInputNotes.map((wasmInputNote) =>
      wasmInputNoteToInputNote({
        record: wasmInputNote,
        previousInputNote: previousInputNotes.find(
          ({ id }) => id === wasmInputNote.id().toString(),
        ),
        scripts,
        midenSdk,
      }),
    );
  } else {
    const endpoints = {
      mtst: Endpoint.testnet(),
      mdev: Endpoint.devnet(),
      mlcl: Endpoint.localhost(),
      mmck: Endpoint.localhost(),
    } as const;
    const rpcClient = new RpcClient(endpoints[networkId]);
    const wasmFetchedNotes = await rpcClient.getNotesById(
      wasmInputNotes.map((wasmInputNote) => wasmInputNote.id()),
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
            ({ id }) => id === wasmInputNote.id().toString(),
          ),
          scripts,
          midenSdk,
        }),
      ),
    );
  }
};

export const clientGetInputNote = ({
  client,
  noteId,
}: {
  client: WebClientType;
  noteId: string;
}) => client.getInputNote(noteId);

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

const invokeGetterCustomTransactionScript = ({
  accountIdPrefix,
  accountIdSuffix,
  procHash,
}: {
  accountIdPrefix: string;
  accountIdSuffix: string;
  procHash: string;
}) => `use external_contract::getter
use miden::core::sys

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
  procedureExport: ProcedureExport;
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
  const builder = client.createCodeBuilder();
  const accountComponentLibrary = builder.buildLibrary(
    "external_contract::getter",
    getterScript.masm,
  );
  builder.linkDynamicLibrary(accountComponentLibrary);
  const wasmAccountId = AccountId.fromHex(accountId);
  const transactionScript = builder.compileTxScript(
    invokeGetterCustomTransactionScript({
      accountIdPrefix: wasmAccountId.prefix().toString(),
      accountIdSuffix: wasmAccountId.suffix().toString(),
      procHash: procedureExport.digest,
    }),
  );
  const transactionRequest = new TransactionRequestBuilder()
    .withCustomScript(transactionScript)
    .withForeignAccounts(
      new MidenArrays.ForeignAccountArray([
        ForeignAccount.public(
          AccountId.fromHex(accountId),
          new AccountStorageRequirements(),
        ),
      ]),
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
  const builder = client.createCodeBuilder();
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
      wasmStorageSlotFromStorageSlot({
        storageSlot,
        midenSdk,
      }),
    );
    let accountComponent = script.masm
      ? AccountComponent.compile(
          builder.compileAccountComponentCode(script.masm),
          storageSlots,
        )
      : AccountComponent.fromPackage(
          Package.deserialize(fromBase64(script.masp)),
          new MidenArrays.StorageSlotArray(storageSlots),
        );
    const procedures = accountComponent.getProcedures();
    for (const procedure of procedures) {
      console.log(procedure.digest.toHex());
    }
    // if (script.id === "no-auth") {
    // console.log(script.id);
    // console.log("get_count", accountComponent.getProcedureHash("get_count"));
    // console.log(
    //   "increment_count",
    //   accountComponent.getProcedureHash("increment_count"),
    // );
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

export const createTransactionFromScript = ({
  script,
  midenSdk: { Package, TransactionScript, TransactionRequestBuilder },
}: {
  script: Script;
  midenSdk: MidenSdk;
}) => {
  const transactionScript = TransactionScript.fromPackage(
    Package.deserialize(fromBase64(script.masp)),
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
  const builder = client.createCodeBuilder();
  const dependencies = script.dependencies
    .map((dependency) => scripts.find(({ id }) => id === dependency.id))
    .filter((dependency) => dependency?.masm)
    .filter((dependency) => dependency !== undefined);
  for (const dependency of dependencies) {
    const contractName = dependency.name.replaceAll("-", "_");
    const accountComponentLibrary = builder.buildLibrary(
      `external_contract::${contractName}`,
      dependency.masm,
    );
    builder.linkDynamicLibrary(accountComponentLibrary);
  }
  return builder.compileNoteScript(script.masm);
};

const createNoteScriptFromPackage = ({
  script,
  midenSdk: { NoteScript, Package },
}: {
  script: Script;
  midenSdk: MidenSdk;
}) => NoteScript.fromPackage(Package.deserialize(fromBase64(script.masp)));

export const clientCreateNoteFromScript = ({
  client,
  senderAccountId,
  recipientAccountId,
  networkRecipient,
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
  networkRecipient: boolean;
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
    NoteMetadata,
    Note,
    AccountId,
    NoteAttachment,
    NoteExecutionHint,
  } = midenSdk;
  const noteScript = script.masm
    ? clientCreateNoteScriptFromMasm({ client, script, scripts })
    : createNoteScriptFromPackage({ script, midenSdk });
  const assets = new NoteAssets(
    faucetAccountId
      ? [new FungibleAsset(AccountId.fromHex(faucetAccountId), amount)]
      : [],
  );
  let metadata = new NoteMetadata(
    AccountId.fromHex(senderAccountId),
    type === "public" ? NoteType.Public : NoteType.Private,
    NoteTag.withAccountTarget(AccountId.fromHex(recipientAccountId)),
  );
  if (networkRecipient) {
    metadata = metadata.withAttachment(
      NoteAttachment.newNetworkAccountTarget(
        AccountId.fromHex(recipientAccountId),
        NoteExecutionHint.none(),
      ),
    );
  }
  const randomBigUints = new BigUint64Array(4);
  crypto.getRandomValues(randomBigUints);
  const serialNum = new Word(randomBigUints);
  const inputs = new NoteInputs(
    new FeltArray(noteInputs.map((noteInput) => new Felt(BigInt(noteInput)))),
  );
  const recipient = new NoteRecipient(serialNum, noteScript, inputs);
  return new Note(assets, metadata, recipient);
};

export const clientImportNoteFile = async ({
  client,
  noteFileBytes,
  scripts,
  midenSdk,
}: {
  client: WebClientType;
  noteFileBytes: Uint8Array;
  scripts: Script[];
  midenSdk: MidenSdk;
}) => {
  const noteId = await client.importNoteFile(
    midenSdk.NoteFile.deserialize(noteFileBytes),
  );
  const record = await client.getInputNote(noteId.toString());
  if (!record) {
    throw new Error();
  }
  return wasmInputNoteToInputNote({ record, scripts, midenSdk });
};

export const clientExportNoteFile = async ({
  client,
  noteId,
}: {
  client: WebClientType;
  noteId: string;
}) => {
  const noteFile = await client.exportNoteFile(noteId, "Details");
  return noteFile.serialize();
};

export const clientExportInputNoteFile = async ({
  client,
  noteId,
  midenSdk: { NoteFile },
}: {
  client: WebClientType;
  noteId: string;
  midenSdk: MidenSdk;
}) => {
  const record = await client.getInputNote(noteId);
  if (!record) {
    throw new Error("Input note not found");
  }
  try {
    const inputNote = record.toInputNote();
    return NoteFile.fromInputNote(inputNote).serialize();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NoteFile.fromNoteDetails(record.details()).serialize();
  }
};

// export const clientSendPrivateNote = async ({
//   client,
//   address,
//   midenSdk: { Address },
// }: {
//   client: WebClientType;
//   address: string;
//   midenSdk: MidenSdk;
// }) => client.sendPrivateNote(note, Address.fromBech32(address));

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

export const storageMode = (accountId: WasmAccountIdType) =>
  accountId.isPublic()
    ? "public"
    : accountId.isNetwork()
      ? "network"
      : "private";

export const accountIdToAddress = ({
  accountId,
  networkId,
  midenSdk: { AccountId, AccountInterface, NetworkId },
}: {
  accountId: string;
  networkId: NetworkId;
  midenSdk: MidenSdk;
}) =>
  AccountId.fromHex(accountId).toBech32(
    NetworkId.custom(networkId),
    AccountInterface.BasicWallet,
  );

export const addressToAccountId = ({
  address,
  midenSdk: { Address },
}: {
  address: string;
  midenSdk: MidenSdk;
}) => Address.fromBech32(address).accountId();

const verifyDefaultAccountComponents = ({
  wasmAccount,
  midenSdk: { Word },
}: {
  wasmAccount: WasmAccountType;
  midenSdk: MidenSdk;
}) => {
  const code = wasmAccount.code();
  return defaultScripts
    .filter(
      ({ type, procedureExports }) =>
        ["account", "authentication-component"].includes(type) &&
        procedureExports.every(({ digest }) =>
          code.hasProcedure(Word.fromHex(digest)),
        ),
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
  midenSdk,
}: {
  wasmAccount: WasmAccountType;
  name: string;
  components?: string[];
  networkId: NetworkId;
  updatedAt: number;
  consumableNoteIds?: string[];
  midenSdk: MidenSdk;
}): Account => {
  const { BasicFungibleFaucetComponent } = midenSdk;
  const code = wasmAccount.code().commitment().toHex();
  const verifiedComponents = components
    ? components
    : verifyDefaultAccountComponents({ wasmAccount, midenSdk });
  const address = accountIdToAddress({
    accountId: wasmAccount.id().toString(),
    networkId,
    midenSdk,
  });
  const slotNames = wasmAccount.storage().getSlotNames();
  const account: Account = {
    ...defaultAccount(),
    id: wasmAccount.id().toString(),
    name,
    address,
    identifier: getIdentifierPart(address),
    routingParameters: getRoutingParametersPart(address),
    type: accountType(wasmAccount),
    storageMode: storageMode(wasmAccount.id()),
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
    storage: slotNames.reduce<StorageItem[]>((previousValue, currentValue) => {
      const item = wasmAccount.storage().getItem(currentValue);
      const mapEntries = wasmAccount.storage().getMapEntries(currentValue);
      if (mapEntries && item) {
        return [
          ...previousValue,
          {
            name: currentValue,
            type: "map",
            item: item.toHex(),
            mapEntries: mapEntries.map(({ key, value }) => ({ key, value })),
          },
        ];
      }
      if (item) {
        return [
          ...previousValue,
          {
            name: currentValue,
            type: "value",
            item: item.toHex(),
            mapEntries: [],
          },
        ];
      }
      return previousValue;
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
    const [, , , totalSupply] = stringToFeltArray(getItem(account.storage, 0));
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

const verifyDefaultNotes = ({
  scriptRoot,
  scripts,
}: {
  scriptRoot: string;
  scripts: Script[];
}) =>
  scripts
    .filter(({ type }) => type === "note-script")
    .find(({ digest }) => digest === scriptRoot);

export const wasmInputNoteToInputNote = ({
  record,
  previousInputNote,
  scripts,
  midenSdk,
}: {
  record: WasmInputNoteRecordType;
  previousInputNote?: InputNote;
  scripts: Script[];
  midenSdk: MidenSdk;
}): InputNote => {
  const scriptRoot = record.details().recipient().script().root().toHex();
  const script = verifyDefaultNotes({ scriptRoot, scripts });
  return {
    id: record.id().toString(),
    type: noteType({ metadata: record.metadata(), midenSdk }),
    state: noteState({ state: record.state(), midenSdk }),
    tag: record.metadata()?.tag().asU32().toString() ?? "",
    serialNum: record.details().recipient().serialNum().toHex(),
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
    result.executedTransaction().inputNotes().numNotes(),
  ).map((index) => {
    const note = result.executedTransaction().inputNotes().getNote(index);
    return wasmNoteToNote({ note: note.note(), midenSdk });
  });
  const outputNotes = range(
    result.executedTransaction().outputNotes().numNotes(),
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
  inputs: note
    .recipient()
    .inputs()
    .values()
    .map((value) => value.toString()),
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
      storageSlot.name,
      bigintToWord({ value: BigInt(storageSlot.value), midenSdk }),
    );
  } else {
    const storageMap = new StorageMap();
    const keyValuePairs = storageSlot.value.split(",");
    for (const keyValuePair of keyValuePairs) {
      const [key = "", value = ""] = keyValuePair.split(":");
      storageMap.insert(
        bigintToWord({ value: BigInt(key), midenSdk }),
        bigintToWord({ value: BigInt(value), midenSdk }),
      );
    }
    return StorageSlot.map(storageSlot.name, storageMap);
  }
};
