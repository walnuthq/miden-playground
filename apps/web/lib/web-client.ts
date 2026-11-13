import {
  type Account as WasmAccount,
  AccountBuilder as WasmAccountBuilder,
  AccountComponent as WasmAccountComponent,
  AccountId as WasmAccountId,
  type AccountId as WasmAccountIdType,
  AccountStorageMode as WasmAccountStorageMode,
  BasicFungibleFaucetComponent as WasmBasicFungibleFaucetComponent,
  type CodeBuilder as WasmCodeBuilderType,
  Endpoint as WasmEndpoint,
  Felt as WasmFelt,
  FeltArray as WasmFeltArray,
  FungibleAsset as WasmFungibleAsset,
  type InputNoteRecord as WasmInputNoteRecordType,
  InputNoteState as WasmInputNoteState,
  type InputNoteState as WasmInputNoteStateType,
  MidenArrays as WasmMidenArrays,
  NetworkAccountTarget as WasmNetworkAccountTarget,
  Note as WasmNote,
  NoteAssets as WasmNoteAssets,
  NoteExecutionHint as WasmNoteExecutionHint,
  NoteFile as WasmNoteFile,
  NoteFilter as WasmNoteFilter,
  NoteFilterTypes as WasmNoteFilterTypes,
  NoteId as WasmNoteId,
  NoteMetadata as WasmNoteMetadata,
  type NoteMetadata as WasmNoteMetadataType,
  NoteRecipient as WasmNoteRecipient,
  NoteScript as WasmNoteScript,
  NoteScriptFee as WasmNoteScriptFee,
  NoteStorage as WasmNoteStorage,
  NoteTag as WasmNoteTag,
  NoteType as WasmNoteType,
  Package as WasmPackage,
  RpcClient as WasmRpcClient,
  StorageMap as WasmStorageMap,
  StorageSlot as WasmStorageSlot,
  TransactionFilter as WasmTransactionFilter,
  type TransactionRecord as WasmTransactionRecordType,
  TransactionRequestBuilder as WasmTransactionRequestBuilder,
  type TransactionResult as WasmTransactionResultType,
  TransactionScript as WasmTransactionScript,
  Word as WasmWord,
  type WebClient as WebClientType,
} from "@miden-sdk/miden-sdk";
import { normalizeAccountId } from "@miden-sdk/react";
import { EMPTY_WORD, MAINNET_RPC_URL } from "@/lib/constants";
import type {
  Account,
  AccountMultisig,
  AccountStorageMode,
  StorageItem,
} from "@/lib/types/account";
import type { Component, StorageSlot } from "@/lib/types/component";
import defaultComponents from "@/lib/types/default-components";
import defaultScripts from "@/lib/types/default-scripts";
import type { NetworkId } from "@/lib/types/network";
import type { InputNote, NoteType } from "@/lib/types/note";
import type { MidenInput, ProcedureExport, Script } from "@/lib/types/script";
import type { State } from "@/lib/types/state";
import type { Transaction, TransactionNote } from "@/lib/types/transaction";
import { fromBase64, toBase64, waitUntil } from "@/lib/utils";
import {
  defaultAccount,
  getIdentifierPart,
  getRoutingParametersPart,
} from "@/lib/utils/account";
import { missingProcedures } from "@/lib/utils/account-procedures";
import { stringToKeyValues } from "@/lib/utils/component";
import {
  assembledFromMasm,
  entryPointExport,
  invokeProcedureCustomTransactionScript,
} from "@/lib/utils/script";
import { wordFelts } from "@/lib/utils/storage-slots";

export const randomWord = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const view = new DataView(bytes.buffer);
  const u64s = new BigUint64Array([
    view.getBigUint64(0, true),
    view.getBigUint64(8, true),
    view.getBigUint64(16, true),
    view.getBigUint64(24, true),
  ]);
  return new WasmWord(u64s);
};

const wasmRpcClient = (networkId: NetworkId) => {
  const endpoints = {
    mm: () => new WasmEndpoint(MAINNET_RPC_URL),
    mtst: () => WasmEndpoint.testnet(),
    mdev: () => WasmEndpoint.devnet(),
    mlcl: () => WasmEndpoint.localhost(),
    mmck: () => WasmEndpoint.localhost(),
  } as const;
  return new WasmRpcClient(endpoints[networkId]());
};

export const clientGetConsumableNotes = ({
  client,
  accountId,
}: {
  client: WebClientType;
  accountId: string;
}) => client.getConsumableNotes(WasmAccountId.fromHex(accountId));

export const clientGetNotesById = ({
  networkId,
  noteIds,
}: {
  networkId: NetworkId;
  noteIds: string[];
}) =>
  wasmRpcClient(networkId).getNotesById(
    noteIds.map((noteId) => WasmNoteId.fromHex(noteId)),
  );

export const clientGetLatestBlockNum = async (networkId: NetworkId) => {
  const blockHeader = await wasmRpcClient(networkId).getBlockHeaderByNumber();
  return blockHeader.blockNum();
};

export const clientGetAllInputNotes = async ({
  client,
  networkId,
  knownNoteIds,
}: {
  client: WebClientType;
  networkId: NetworkId;
  // Notes whose metadata the caller already has: not asked for again.
  knownNoteIds?: Set<string>;
}) => {
  const wasmInputNotes = await client.getInputNotes(
    new WasmNoteFilter(WasmNoteFilterTypes.All),
  );
  const noteIds = wasmInputNotes
    .map((wasmInputNote) => wasmInputNote.id()?.toString())
    .filter((id) => id !== undefined)
    .filter((id) => !knownNoteIds?.has(id));
  if (noteIds.length === 0) {
    return wasmInputNotes;
  }
  const requestedIds = new Set(noteIds);
  const wasmFetchedNotes = await clientGetNotesById({ networkId, noteIds });
  const fetchedById = new Map(
    wasmFetchedNotes.map((wasmFetchedNote) => [
      wasmFetchedNote.noteId.toString(),
      wasmFetchedNote,
    ]),
  );
  return wasmInputNotes.map((wasmInputNote) => {
    const id = wasmInputNote.id()?.toString();
    // A note that wasn't asked for keeps its own metadata.
    if (id !== undefined && requestedIds.has(id)) {
      wasmInputNote.metadata = () => fetchedById.get(id)?.metadata;
    }
    return wasmInputNote;
  });
};

export const clientGetAccounts = async ({
  client,
  accountIds,
}: {
  client: WebClientType;
  accountIds: string[];
}) => {
  const accounts = await Promise.all(
    accountIds.map(async (accountId) => {
      let wasmAccount = await client.getAccount(
        WasmAccountId.fromHex(accountId),
      );
      if (!wasmAccount) {
        try {
          await client.importAccountById(WasmAccountId.fromHex(accountId));
        } catch {
          return undefined;
        }
        wasmAccount = await client.getAccount(WasmAccountId.fromHex(accountId));
      }
      return wasmAccount;
    }),
  );
  return accounts.filter((account) => account !== undefined);
};

// The procedure roots an account's code lacks (`missingProcedures`), for the
// Simulate tab's target dropdown. It only reads the store, never writes it:
// undefined when the account isn't there or can't be read.
export const clientAccountMissingProcedures = async ({
  client,
  accountId,
  roots,
}: {
  client: WebClientType;
  accountId: string;
  roots: string[];
}) => {
  try {
    const wasmAccount = await client.getAccount(
      WasmAccountId.fromHex(accountId),
    );
    if (!wasmAccount) {
      return undefined;
    }
    const code = wasmAccount.code();
    return missingProcedures(roots, (root) =>
      code.hasProcedure(WasmWord.fromHex(root)),
    );
  } catch {
    return undefined;
  }
};

export const clientGetAllTransactions = (client: WebClientType) =>
  client.getTransactions(WasmTransactionFilter.all());

// Upper bound we assume for the cycles of a network transaction consuming one of
// the playground's custom notes (the standards' benchmarked P2ID is ~2^16).
const NETWORK_NOTE_CONSUMPTION_LOG_CYCLES = 20;

// The fee a network account charges the sender of each of its allowed custom
// notes, through the FEE_SPONSORSHIP note the sender's fee payment creates for
// every network note (miden-standards `fee::pay_fee`). It mirrors miden-tx's
// `NetworkNotePricer`: base fee × (⌊log₂(cycles)⌋ + 1), plus its default
// one-cycle safety margin. Charged on mainnet only, so the account's own
// balance just pays for its deployment; elsewhere notes stay free, as the
// tutorials' senders aren't funded for it.
export const clientNetworkNoteFee = async (networkId: NetworkId) => {
  if (networkId !== "mm") {
    return 0n;
  }
  const blockHeader = await wasmRpcClient(networkId).getBlockHeaderByNumber();
  return (
    BigInt(blockHeader.verificationBaseFee()) *
    BigInt(NETWORK_NOTE_CONSUMPTION_LOG_CYCLES + 2)
  );
};

// An account component built from a script (its package, or its MASM for the
// built-in ones) and its storage slots' initial values.
export const wasmAccountComponent = ({
  builder,
  script,
  storageSlots,
}: {
  builder: WasmCodeBuilderType;
  script: Script;
  storageSlots: StorageSlot[];
}) => {
  const wasmStorageSlots = storageSlots.map((storageSlot) =>
    wasmStorageSlotFromStorageSlot(storageSlot),
  );
  const accountComponent = assembledFromMasm(script)
    ? WasmAccountComponent.compile(
        builder.compileAccountComponentCode(script.masm),
        wasmStorageSlots,
      )
    : WasmAccountComponent.fromPackage(
        WasmPackage.deserialize(fromBase64(script.masp)),
        new WasmMidenArrays.StorageSlotArray(wasmStorageSlots),
      );
  return accountComponent.withSupportsAllTypes();
};

export const clientDeployAccount = async ({
  client,
  storageMode,
  components,
  scripts,
  networkNoteFee = 0n,
}: {
  client: WebClientType;
  storageMode: AccountStorageMode;
  components: Component[];
  scripts: Script[];
  // What the account's custom notes cost their senders (network accounts only).
  networkNoteFee?: bigint;
}) => {
  // Fees are denominated in the native asset of the chain, whose faucet is advertised
  // by the protocol configuration the client receives when it syncs.
  const [builder, feeFaucetId] = await Promise.all([
    client.createCodeBuilder(),
    client.feeFaucetId(),
  ]);
  const initSeed = new Uint8Array(32);
  crypto.getRandomValues(initSeed);
  const accountStorageModes = {
    public: WasmAccountStorageMode.public(),
    private: WasmAccountStorageMode.private(),
  } as const;
  let accountBuilder = new WasmAccountBuilder(initSeed)
    .storageMode(accountStorageModes[storageMode])
    .withBasicWalletComponent();
  for (const component of components) {
    if (component.scriptId === "auth-no-auth") {
      accountBuilder = accountBuilder.withNoAuthComponent();
      continue;
    }
    if (component.scriptId === "auth-network-account") {
      const { value: allowedNoteScriptRootsRaw } = component.storageSlots.find(
        ({ name }) =>
          name ===
          "miden::standards::auth::network_account::allowed_note_scripts",
      ) ?? { value: "" };
      const allowedNoteScriptFees = allowedNoteScriptRootsRaw
        .split(",")
        .map((keyValue) => keyValue.split(":").at(0) ?? "")
        .filter((root) => root)
        .map(
          (root) =>
            new WasmNoteScriptFee(WasmWord.fromHex(root), networkNoteFee),
        );
      const { value: allowedTransactionScriptRootsRaw } =
        component.storageSlots.find(
          ({ name }) =>
            name ===
            "miden::standards::auth::network_account::allowed_tx_scripts",
        ) ?? { value: "" };
      const allowedTransactionScriptRoots = allowedTransactionScriptRootsRaw
        .split(",")
        .map((keyValue) => keyValue.split(":").at(0) ?? "")
        .filter((root) => root)
        .map((root) => WasmWord.fromHex(root));
      // Returns the auth component along with the components backing its fee policy,
      // all of which have to be installed on the account.
      const authComponents = WasmAccountComponent.createNetworkAuthComponents(
        [
          ...allowedNoteScriptFees,
          // P2ID stays free: a plain P2ID (e.g. the funding note from Bread
          // Wallet) isn't a network note, so no sponsorship comes with it, and
          // a priced note without one fails the network transaction.
          new WasmNoteScriptFee(WasmNoteScript.p2id().root(), 0n),
        ],
        feeFaucetId,
        allowedTransactionScriptRoots,
      );
      for (const authComponent of authComponents) {
        accountBuilder = accountBuilder.withComponent(authComponent);
      }
      continue;
    }
    const script = scripts.find(({ id }) => id === component.scriptId);
    if (!script) {
      continue;
    }
    const accountComponent = wasmAccountComponent({
      builder,
      script,
      storageSlots: component.storageSlots,
    });
    if (component.type === "authentication-component") {
      accountBuilder = accountBuilder.withAuthComponent(accountComponent);
    } else {
      accountBuilder = accountBuilder.withComponent(accountComponent);
    }
  }
  const { account } = accountBuilder.build();
  // console.log(toBase64(account.serialize()));
  await client.newAccount(account, true);
  return account;
};

// A transaction script that calls one of an account component's procedures
// with the given inputs, linked against the component.
export const procedureCallScript = async ({
  client,
  script,
  procedureExport,
  procedureInputs = [],
}: {
  client: WebClientType;
  script: Script;
  procedureExport: ProcedureExport;
  procedureInputs?: MidenInput[];
}) => {
  const builder = await client.createCodeBuilder();
  const contractName = script.name.replaceAll("-", "_");
  const accountComponentLibrary = assembledFromMasm(script)
    ? builder.buildLibrary(`external_contract::${contractName}`, script.masm)
    : WasmPackage.deserialize(fromBase64(script.masp)).asLibrary();
  builder.linkDynamicLibrary(accountComponentLibrary);
  return builder.compileTxScript(
    invokeProcedureCustomTransactionScript({
      contractName: assembledFromMasm(script) ? contractName : undefined,
      procedureExport,
      procedureInputs,
    }),
  );
};

// An account id's two felts, as procedure arguments take it.
export const accountIdParts = (accountId: string) => {
  const wasmAccountId = WasmAccountId.fromHex(accountId);
  return {
    prefix: wasmAccountId.prefix().asInt(),
    suffix: wasmAccountId.suffix().asInt(),
  };
};

const createTransactionFromMasm = async ({
  client,
  accountScript,
  txScript,
}: {
  client: WebClientType;
  accountScript: Script;
  txScript: Script;
}) => {
  const builder = await client.createCodeBuilder();
  const contractName = accountScript.name.replaceAll("-", "_");
  const accountComponentLibrary = assembledFromMasm(accountScript)
    ? builder.buildLibrary(
        `external_contract::${contractName}`,
        accountScript.masm,
      )
    : WasmPackage.deserialize(fromBase64(accountScript.masp)).asLibrary();
  builder.linkDynamicLibrary(accountComponentLibrary);
  const transactionScript = builder.compileTxScript(txScript.masm);
  // console.log(transactionScript.root().toHex());
  const transactionRequestBuilder =
    new WasmTransactionRequestBuilder().withCustomScript(transactionScript);
  return transactionRequestBuilder.build();
};

const createTransactionFromPackage = async (script: Script) => {
  const transactionScript = WasmTransactionScript.fromPackage(
    WasmPackage.deserialize(fromBase64(script.masp)),
  );
  const transactionRequestBuilder =
    new WasmTransactionRequestBuilder().withCustomScript(transactionScript);
  return transactionRequestBuilder.build();
};

export const clientCreateTransactionFromScript = ({
  client,
  accountScript,
  txScript,
}: {
  client: WebClientType;
  accountScript?: Script;
  txScript: Script;
}) => {
  if (assembledFromMasm(txScript)) {
    if (!accountScript) {
      throw new Error("Account Script not found");
    }
    return createTransactionFromMasm({ client, accountScript, txScript });
  }
  return createTransactionFromPackage(txScript);
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
    .filter((dependency) => dependency !== undefined)
    .filter((dependency) => assembledFromMasm(dependency));
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
  isNetworkNote,
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
  isNetworkNote: boolean;
  script: Script;
  type: NoteType;
  faucetAccountId: string;
  amount: bigint;
  noteStorage: string[];
  scripts: Script[];
}) => {
  const noteScript = assembledFromMasm(script)
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
  const note = isNetworkNote
    ? WasmNote.withAttachments(assets, metadata, recipient, [
        new WasmNetworkAccountTarget(
          WasmAccountId.fromHex(recipientAccountId),
          WasmNoteExecutionHint.always(),
        ).toAttachment(),
      ])
    : new WasmNote(assets, metadata, recipient);
  // console.log(toBase64(note.serialize()));
  return note;
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
  return wasmInputNoteRecordToInputNote({ record, scripts, noteFileBytes });
};

// Unused at the moment. Needs NoteExportFormat as WasmNoteExportFormat imported from the SDK.
// export const clientExportNoteFile = async ({
//   client,
//   noteId,
// }: {
//   client: WebClientType;
//   noteId: string;
// }) => {
//   const noteFile = await client.exportNoteFile(
//     noteId,
//     WasmNoteExportFormat.Details,
//   );
//   return noteFile.serialize();
// };

// Unused at the moment.
// export const clientExportInputNoteFile = async ({
//   client,
//   noteId,
// }: {
//   client: WebClientType;
//   noteId: string;
// }) => {
//   const record = await client.getInputNote(noteId);
//   if (!record) {
//     throw new Error("Input note not found");
//   }
//   try {
//     const inputNote = record.toInputNote();
//     return WasmNoteFile.fromInputNote(inputNote).serialize();
//   } catch {
//     return WasmNoteFile.fromNoteDetails(record.details()).serialize();
//   }
// };

// Since SDK 0.17.2 a failed private-note send is final: sync() no longer
// retries it. If the playground sends private notes itself, prefer
// useTransaction({ privateNoteTarget }) and handle its PrivateNoteDeliveryError
// by resending the undelivered notes with useResendPrivateNotes.
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

// The components an account's code holds, by their scripts' exports: the
// built-ins and, given the workspace, its compiled packages too, so an
// imported account whose code holds a package's procedures lists that
// package's component. A draft has no exports and matches nothing.
export const verifyAccountComponents = (
  wasmAccount: WasmAccount,
  {
    scripts = defaultScripts,
    components = defaultComponents,
  }: Partial<Pick<State, "scripts" | "components">> = {},
) => {
  const code = wasmAccount.code();
  return scripts
    .filter(
      ({ type, status, procedureExports }) =>
        ["account-component", "authentication-component"].includes(type) &&
        status === "compiled" &&
        procedureExports.length > 0 &&
        procedureExports.every(({ digest }) =>
          code.hasProcedure(WasmWord.fromHex(digest)),
        ),
    )
    .flatMap((script) => {
      const component = components.find(
        ({ scriptId }) => scriptId === script.id,
      );
      return component ? [component.id] : [];
    });
};

export const wasmAccountToAccount = ({
  wasmAccount,
  name,
  components,
  workspace,
  multisig,
  updatedAt,
  consumableNoteIds = [],
}: {
  wasmAccount: WasmAccount;
  name: string;
  components?: string[];
  // The workspace's scripts and components, matched against the account's
  // code when `components` isn't given (verifyAccountComponents).
  workspace?: Pick<State, "scripts" | "components">;
  multisig?: AccountMultisig;
  updatedAt?: number | null;
  consumableNoteIds?: string[];
}): Account => {
  const code = wasmAccount.code().commitment().toHex();
  const verifiedComponents =
    components ?? verifyAccountComponents(wasmAccount, workspace);
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
    storage: slotNames.flatMap<StorageItem>((name) => {
      const item = wasmAccount.storage().getItem(name);
      const mapEntries = wasmAccount.storage().getMapEntries(name);
      if (mapEntries && item) {
        return [
          {
            name,
            type: "map",
            item: item.toHex(),
            mapEntries: mapEntries.map(({ key, value }) => ({ key, value })),
          },
        ];
      }
      if (item) {
        return [{ name, type: "value", item: item.toHex(), mapEntries: [] }];
      }
      return [];
    }),
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
    account.totalSupply = basicFungibleFaucetComponent.tokenSupply().toString();
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
    .filter(({ type }) => type === "note")
    .find((script) => entryPointExport(script)?.digest === scriptRoot);

export const wasmInputNoteRecordToInputNote = ({
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
    // Notes can show up before their metadata is known (e.g. an expected
    // output note): fill these in once it is.
    tag:
      previousInputNote?.tag ||
      (record.metadata()?.tag().asU32().toString() ?? ""),
    serialNum: record.details().recipient().serialNum().toHex(),
    senderId:
      previousInputNote?.senderId ||
      (record.metadata()?.sender().toString() ?? ""),
    scriptRoot,
    // A note recorded before its script was known (e.g. a standard note added
    // since) gets it now.
    scriptId: previousInputNote?.scriptId || (script?.id ?? ""),
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
    // Kept once known: consumed notes can drop their inclusion proof.
    blockNum:
      record.inclusionProof()?.location().blockNum() ??
      previousInputNote?.blockNum ??
      0,
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
  scripts,
}: {
  record: WasmTransactionRecordType;
  result: WasmTransactionResultType;
  scripts: Script[];
}): Transaction => {
  const inputNotes = Array.from(
    { length: result.executedTransaction().inputNotes().numNotes() },
    (_, index) => index,
  ).map((index) => {
    const note = result.executedTransaction().inputNotes().getNote(index);
    return wasmNoteToNote({ note: note.note(), scripts });
  });
  const outputNotes = Array.from(
    { length: result.executedTransaction().outputNotes().numNotes() },
    (_, index) => index,
  )
    .map((index) => {
      const note = result.executedTransaction().outputNotes().getNote(index);
      return note.intoFull();
    })
    .filter((note) => note !== undefined)
    .map((note) => wasmNoteToNote({ note, scripts }));
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
  scripts,
}: {
  note: WasmNote;
  scripts: Script[];
}): TransactionNote => {
  const scriptRoot = note.recipient().script().root().toHex();
  const script = verifyStandardNotes({ scriptRoot, scripts });
  return {
    id: note.id().toString(),
    type: noteType(note.metadata()),
    scriptRoot,
    scriptId: script?.id ?? "",
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
  };
};

// Values, map keys and map values are written as a felt (a word's first
// element) or as a whole word in hex (`wordFelts`).
const wasmWordFromText = (text: string) =>
  new WasmWord(new BigUint64Array(wordFelts(text)));

export const wasmStorageSlotFromStorageSlot = (storageSlot: StorageSlot) => {
  if (storageSlot.type === "value") {
    return WasmStorageSlot.fromValue(
      storageSlot.name,
      wasmWordFromText(storageSlot.value),
    );
  }
  const storageMap = new WasmStorageMap();
  for (const { key, value } of stringToKeyValues(storageSlot.value)) {
    storageMap.insert(wasmWordFromText(key), wasmWordFromText(value));
  }
  return WasmStorageSlot.map(storageSlot.name, storageMap);
};

export const wasmWordFromHex = (value: string) => {
  try {
    return WasmWord.fromHex(value).toU64s();
  } catch {
    return new BigUint64Array([0n, 0n, 0n, 0n]);
  }
};

export const newWasmWord = (u64Vec: BigUint64Array<ArrayBufferLike>) => {
  try {
    return new WasmWord(u64Vec).toHex();
  } catch {
    return EMPTY_WORD;
  }
};
