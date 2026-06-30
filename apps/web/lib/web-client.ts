import { range } from "lodash";
import {
  type Account as WasmAccount,
  type WebClient as WebClientType,
  type InputNoteRecord as WasmInputNoteRecordType,
  type NoteMetadata as WasmNoteMetadataType,
  type TransactionResult as WasmTransactionResultType,
  type InputNoteState as WasmInputNoteStateType,
  type TransactionRecord as WasmTransactionRecordType,
  type AccountId as WasmAccountIdType,
  AccountStorageMode as WasmAccountStorageMode,
  AccountBuilder as WasmAccountBuilder,
  AccountComponent as WasmAccountComponent,
  // Address as WasmAddress,
  Note as WasmNote,
  Word as WasmWord,
  BasicFungibleFaucetComponent as WasmBasicFungibleFaucetComponent,
  StorageSlot as WasmStorageSlot,
  StorageMap as WasmStorageMap,
  NoteFilter as WasmNoteFilter,
  NoteFilterTypes as WasmNoteFilterTypes,
  NoteType as WasmNoteType,
  InputNoteState as WasmInputNoteState,
  NoteScript as WasmNoteScript,
  Package as WasmPackage,
  NoteAssets as WasmNoteAssets,
  AccountId as WasmAccountId,
  FungibleAsset as WasmFungibleAsset,
  NoteMetadata as WasmNoteMetadata,
  NoteTag as WasmNoteTag,
  // NoteAttachment as WasmNoteAttachment,
  // NoteExecutionHint as WasmNoteExecutionHint,
  NoteStorage as WasmNoteStorage,
  FeltArray as WasmFeltArray,
  Felt as WasmFelt,
  NoteRecipient as WasmNoteRecipient,
  TransactionFilter as WasmTransactionFilter,
  TransactionScript as WasmTransactionScript,
  TransactionRequestBuilder as WasmTransactionRequestBuilder,
  NoteFile as WasmNoteFile,
  NoteExportFormat as WasmNoteExportFormat,
  MidenArrays as WasmMidenArrays,
  Endpoint as WasmEndpoint,
  RpcClient as WasmRpcClient,
} from "@miden-sdk/miden-sdk/lazy";
import { normalizeAccountId } from "@miden-sdk/react/lazy";
import type { NetworkId } from "@/lib/types/network";
import type {
  Account,
  AccountMultisig,
  AccountStorageMode,
  StorageItem,
} from "@/lib/types/account";
import {
  defaultAccount,
  getIdentifierPart,
  getItem,
  getRoutingParametersPart,
} from "@/lib/utils/account";
import type { InputNote, NoteType } from "@/lib/types/note";
import type { TransactionNote, Transaction } from "@/lib/types/transaction";
import type { Script } from "@/lib/types/script";
import { defaultProcedureExport } from "@/lib/utils/script";
import type { StorageSlot, Component } from "@/lib/types/component";
import defaultScripts from "@/lib/types/default-scripts";
import { fromBase64, toBase64, waitUntil } from "@/lib/utils";

export const clientGetConsumableNotes = ({
  client,
  accountId,
}: {
  client: WebClientType;
  accountId: string;
}) => client.getConsumableNotes(WasmAccountId.fromHex(accountId));

export const clientGetAllInputNotes = async ({
  client,
  networkId,
}: {
  client: WebClientType;
  networkId: NetworkId;
}) => {
  const wasmInputNotes = await client.getInputNotes(
    new WasmNoteFilter(WasmNoteFilterTypes.All),
  );
  const endpoints = {
    mtst: WasmEndpoint.testnet(),
    mdev: WasmEndpoint.devnet(),
    mlcl: WasmEndpoint.localhost(),
    mmck: WasmEndpoint.localhost(),
  } as const;
  const rpcClient = new WasmRpcClient(endpoints[networkId]);
  const wasmFetchedNotes = await rpcClient.getNotesById(
    wasmInputNotes
      .map((wasmInputNote) => wasmInputNote.id())
      .filter((id) => id !== undefined),
  );
  return wasmInputNotes.map((wasmInputNote, index) => {
    wasmInputNote.metadata = () => wasmFetchedNotes[index]?.metadata;
    return wasmInputNote;
  });
};

export const clientGetAccounts = ({
  client,
  accountIds,
}: {
  client: WebClientType;
  accountIds: string[];
}) =>
  Promise.all(
    accountIds.map(async (accountId) => {
      let wasmAccount = await client.getAccount(
        WasmAccountId.fromHex(accountId),
      );
      if (!wasmAccount) {
        await client.importAccountById(WasmAccountId.fromHex(accountId));
        wasmAccount = await client.getAccount(WasmAccountId.fromHex(accountId));
        if (!wasmAccount) {
          throw new Error("Account not found");
        }
      }
      return wasmAccount;
    }),
  );

export const clientGetAllTransactions = (client: WebClientType) =>
  client.getTransactions(WasmTransactionFilter.all());

export const clientDeployAccount = async ({
  client,
  storageMode,
  components,
  scripts,
}: {
  client: WebClientType;
  storageMode: AccountStorageMode;
  components: Component[];
  scripts: Script[];
}) => {
  const builder = await client.createCodeBuilder();
  const initSeed = new Uint8Array(32);
  crypto.getRandomValues(initSeed);
  const accountStorageModes = {
    public: WasmAccountStorageMode.public(),
    private: WasmAccountStorageMode.private(),
  } as const;
  let accountBuilder = new WasmAccountBuilder(initSeed).storageMode(
    accountStorageModes[storageMode],
  );
  for (const component of components) {
    if (component.scriptId === "auth-no-auth") {
      accountBuilder = accountBuilder.withNoAuthComponent();
      continue;
    }
    const script = scripts.find(({ id }) => id === component.scriptId);
    if (!script) {
      continue;
    }
    const storageSlots = component.storageSlots.map((storageSlot) =>
      wasmStorageSlotFromStorageSlot(storageSlot),
    );
    let accountComponent = script.masm
      ? WasmAccountComponent.compile(
          builder.compileAccountComponentCode(script.masm),
          storageSlots,
        )
      : WasmAccountComponent.fromPackage(
          WasmPackage.deserialize(fromBase64(script.masp)),
          new WasmMidenArrays.StorageSlotArray(storageSlots),
        );
    const procedures = accountComponent.getProcedures();
    for (const procedure of procedures) {
      console.log(script.id);
      console.log(procedure.digest.toHex());
    }
    // if (script.id === "auth-no-auth") {
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

export const createTransactionFromScript = (script: Script) => {
  const transactionScript = WasmTransactionScript.fromPackage(
    WasmPackage.deserialize(fromBase64(script.masp)),
  );
  const transactionRequestBuilder =
    new WasmTransactionRequestBuilder().withCustomScript(transactionScript);
  return transactionRequestBuilder.build();
};

const clientCreateNoteScriptFromMasm = async ({
  client,
  script,
  scripts,
}: {
  client: WebClientType;
  script: Script;
  scripts: Script[];
}) => {
  const builder = await client.createCodeBuilder();
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

const createNoteScriptFromPackage = (script: Script) =>
  WasmNoteScript.fromPackage(WasmPackage.deserialize(fromBase64(script.masp)));

export const clientCreateNoteFromScript = async ({
  client,
  senderAccountId,
  recipientAccountId,
  networkRecipient,
  script,
  type,
  faucetAccountId,
  amount,
  noteStorage,
  scripts,
}: {
  client: WebClientType;
  senderAccountId: string;
  recipientAccountId: string;
  networkRecipient: boolean;
  script: Script;
  type: NoteType;
  faucetAccountId: string;
  amount: bigint;
  noteStorage: string[];
  scripts: Script[];
}) => {
  const noteScript = script.masm
    ? await clientCreateNoteScriptFromMasm({ client, script, scripts })
    : createNoteScriptFromPackage(script);
  const assets = new WasmNoteAssets(
    faucetAccountId
      ? [new WasmFungibleAsset(WasmAccountId.fromHex(faucetAccountId), amount)]
      : [],
  );
  const metadata = new WasmNoteMetadata(
    WasmAccountId.fromHex(senderAccountId),
    type === "public" ? WasmNoteType.Public : WasmNoteType.Private,
    WasmNoteTag.withAccountTarget(WasmAccountId.fromHex(recipientAccountId)),
  );
  if (networkRecipient) {
    // TODO
    // metadata = metadata.withAttachment(
    //   WasmNoteAttachment.newNetworkAccountTarget(
    //     WasmAccountId.fromHex(recipientAccountId),
    //     WasmNoteExecutionHint.none(),
    //   ),
    // );
  }
  const randomBigUints = new BigUint64Array(4);
  crypto.getRandomValues(randomBigUints);
  const serialNum = new WasmWord(randomBigUints);
  const storage = new WasmNoteStorage(
    new WasmFeltArray(
      noteStorage.map(
        (noteStorageItem) => new WasmFelt(BigInt(noteStorageItem)),
      ),
    ),
  );
  const recipient = new WasmNoteRecipient(serialNum, noteScript, storage);
  return new WasmNote(assets, metadata, recipient);
};

export const clientImportNoteFile = async ({
  client,
  noteId,
  noteFileBytes,
  scripts,
}: {
  client: WebClientType;
  noteId: string;
  noteFileBytes: Uint8Array;
  scripts: Script[];
}) => {
  await client.importNoteFile(WasmNoteFile.deserialize(noteFileBytes));
  await waitUntil(async () => {
    const record = await client.getInputNote(noteId);
    return !!record;
  });
  const record = await client.getInputNote(noteId);
  if (!record) {
    throw new Error("Note not found");
  }
  return wasmInputNoteToInputNote({ record, scripts, noteFileBytes });
};

export const clientExportNoteFile = async ({
  client,
  noteId,
}: {
  client: WebClientType;
  noteId: string;
}) => {
  const noteFile = await client.exportNoteFile(
    noteId,
    WasmNoteExportFormat.Details,
  );
  return noteFile.serialize();
};

export const clientExportInputNoteFile = async ({
  client,
  noteId,
}: {
  client: WebClientType;
  noteId: string;
}) => {
  const record = await client.getInputNote(noteId);
  if (!record) {
    throw new Error("Input note not found");
  }
  try {
    const inputNote = record.toInputNote();
    return WasmNoteFile.fromInputNote(inputNote).serialize();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return WasmNoteFile.fromNoteDetails(record.details()).serialize();
  }
};

// export const clientSendPrivateNote = ({
//   client,
//   note,
//   address,
// }: {
//   client: WebClientType;
//   note: WasmNote;
//   address: string;
// }) => client.sendPrivateNote(note, WasmAddress.fromBech32(address));

export const storageMode = (accountId: WasmAccountIdType) =>
  accountId.isPublic() ? "public" : "private";

const verifyStandardAccountComponents = (wasmAccount: WasmAccount) =>
  defaultScripts
    .filter(
      ({ type, procedureExports }) =>
        ["account", "authentication-component"].includes(type) &&
        procedureExports.every(({ digest }) =>
          wasmAccount.code().hasProcedure(WasmWord.fromHex(digest)),
        ),
    )
    .map(({ id }) => id);

export const wasmAccountToAccount = ({
  wasmAccount,
  name,
  components,
  multisig,
  updatedAt,
  consumableNoteIds = [],
}: {
  wasmAccount: WasmAccount;
  name: string;
  components?: string[];
  multisig?: AccountMultisig;
  updatedAt?: number | null;
  consumableNoteIds?: string[];
}): Account => {
  const code = wasmAccount.code().commitment().toHex();
  const verifiedComponents = components
    ? components
    : verifyStandardAccountComponents(wasmAccount);
  const address = normalizeAccountId(wasmAccount.id().toString());
  const slotNames = wasmAccount.storage().getSlotNames();
  const account: Account = {
    ...defaultAccount(),
    id: wasmAccount.id().toString(),
    name,
    address,
    identifier: getIdentifierPart(address),
    routingParameters: getRoutingParametersPart(address),
    isPublic: wasmAccount.isPublic(),
    isPrivate: wasmAccount.isPrivate(),
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
    consumableNoteIds,
    components: verifiedComponents,
    multisig,
    updatedAt: updatedAt ?? Date.now(),
  };
  if (wasmAccount.isFaucet()) {
    const basicFungibleFaucetComponent =
      WasmBasicFungibleFaucetComponent.fromAccount(wasmAccount);
    account.symbol = basicFungibleFaucetComponent.symbol().toString();
    account.decimals = basicFungibleFaucetComponent.decimals();
    account.maxSupply = basicFungibleFaucetComponent.maxSupply().toString();
    const metadata = getItem(
      account.storage.find(
        ({ name }) =>
          name === "miden::standards::faucets::fungible::token_config",
      ),
    );
    const [totalSupply = 0n] = WasmWord.fromHex(metadata).toU64s();
    account.totalSupply = totalSupply.toString();
  }
  return account;
};

const noteType = (metadata: WasmNoteMetadataType) => {
  const wasmNoteTypes = {
    [WasmNoteType.Public]: "public",
    [WasmNoteType.Private]: "private",
  } as const;
  return wasmNoteTypes[metadata.noteType()];
};

const noteState = (state: WasmInputNoteStateType) => {
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

const verifyStandardNotes = ({
  scriptRoot,
  scripts,
}: {
  scriptRoot: string;
  scripts: Script[];
}) =>
  scripts
    .filter(({ type }) => type === "note-script")
    .find(({ procedureExports }) => {
      const [runScript = defaultProcedureExport()] = procedureExports;
      return runScript.digest === scriptRoot;
    });

export const wasmInputNoteToInputNote = ({
  record,
  previousInputNote,
  scripts,
  noteFileBytes,
  updatedAt,
}: {
  record: WasmInputNoteRecordType;
  previousInputNote?: InputNote;
  scripts: Script[];
  noteFileBytes?: Uint8Array;
  updatedAt?: number | null;
}): InputNote => {
  const metadata = record.metadata();
  const scriptRoot = record.details().recipient().script().root().toHex();
  const script = verifyStandardNotes({ scriptRoot, scripts });
  return {
    id: record.id()?.toString() ?? "",
    type: previousInputNote
      ? previousInputNote.type
      : metadata
        ? noteType(metadata)
        : "public",
    state: noteState(record.state()),
    tag: previousInputNote
      ? previousInputNote.tag
      : (record.metadata()?.tag().asU32().toString() ?? ""),
    serialNum: record.details().recipient().serialNum().toHex(),
    senderId: previousInputNote
      ? previousInputNote.senderId
      : (record.metadata()?.sender().toString() ?? ""),
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
    storage: record
      .details()
      .recipient()
      .storage()
      .items()
      .map((item) => item.toString()),
    nullifier: record.nullifier() ?? "",
    noteFileBytes: previousInputNote
      ? previousInputNote.noteFileBytes
      : noteFileBytes
        ? toBase64(noteFileBytes)
        : "",
    updatedAt: previousInputNote
      ? previousInputNote.updatedAt
      : (updatedAt ?? Date.now()),
  };
};

export const transactionStatus = (
  transactionRecord: WasmTransactionRecordType,
) => {
  const status = transactionRecord.transactionStatus();
  if (status.isPending()) {
    return "Pending";
  } else if (status.isCommitted()) {
    return `Committed #${status.getBlockNum()}`;
  } else {
    return "Discarded";
  }
};

export const wasmTransactionToTransaction = ({
  record,
  result,
}: {
  record: WasmTransactionRecordType;
  result: WasmTransactionResultType;
}): Transaction => {
  const inputNotes = range(
    result.executedTransaction().inputNotes().numNotes(),
  ).map((index) => {
    const note = result.executedTransaction().inputNotes().getNote(index);
    return wasmNoteToNote(note.note());
  });
  const outputNotes = range(
    result.executedTransaction().outputNotes().numNotes(),
  )
    .map((index) => {
      const note = result.executedTransaction().outputNotes().getNote(index);
      return note.intoFull();
    })
    .filter((note) => note !== undefined)
    .map((note) => wasmNoteToNote(note));
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

export const wasmNoteToNote = (note: WasmNote): TransactionNote => ({
  id: note.id().toString(),
  type: noteType(note.metadata()),
  scriptRoot: note.recipient().script().root().toHex(),
  senderId: note.metadata()?.sender().toString() ?? "",
  fungibleAssets: note
    .assets()
    .fungibleAssets()
    .map((fungibleAsset) => ({
      faucetId: fungibleAsset.faucetId().toString(),
      amount: fungibleAsset.amount().toString(),
    })),
  storage: note
    .recipient()
    .storage()
    .items()
    .map((item) => item.toString()),
});

export const wasmStorageSlotFromStorageSlot = (storageSlot: StorageSlot) => {
  if (storageSlot.type === "value") {
    return WasmStorageSlot.fromValue(
      storageSlot.name,
      new WasmWord(new BigUint64Array([BigInt(storageSlot.value), 0n, 0n, 0n])),
    );
  } else {
    const storageMap = new WasmStorageMap();
    const keyValuePairs = storageSlot.value.split(",");
    for (const keyValuePair of keyValuePairs) {
      const [key = "", value = ""] = keyValuePair.split(":");
      storageMap.insert(
        new WasmWord(new BigUint64Array([BigInt(key), 0n, 0n, 0n])),
        new WasmWord(new BigUint64Array([BigInt(value), 0n, 0n, 0n])),
      );
    }
    return WasmStorageSlot.map(storageSlot.name, storageMap);
  }
};

export const wasmWordFromHex = (value: string) => {
  try {
    return WasmWord.fromHex(value).toU64s();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return new BigUint64Array([0n, 0n, 0n, 0n]);
  }
};
