import { range } from "lodash";
import { type FunctionComponent } from "react";
import {
  type Account as WasmAccount,
  type Note as WasmNote,
  type TransactionRecord,
  type TransactionResult,
  type InputNoteRecord,
  NoteScript,
  AccountId,
  type NoteMetadata,
  AccountType as WasmAccountType,
} from "@workspace/mock-web-client";
import { type State } from "@/components/global-context/reducer";

export const networks = {
  mtst: "Testnet",
  mlcl: "Sandbox",
} as const;

export type NetworkId = keyof typeof networks;

// ACCOUNTS

export const accountTypes = {
  [WasmAccountType.FungibleFaucet]: "Fungible Faucet",
  [WasmAccountType.NonFungibleFaucet]: "Non Fungible Faucet",
  [WasmAccountType.RegularAccountImmutableCode]: "Regular (immutable)",
  [WasmAccountType.RegularAccountUpdatableCode]: "Regular (updatable)",
} as const;

export type AccountType = keyof typeof accountTypes;

export type FungibleAsset = { faucetId: string; amount: string };

export type Account = {
  id: string;
  name: string;
  address: string;
  type: string;
  storageMode: "Public" | "Private";
  isFaucet: boolean;
  isPublic: boolean;
  nonce: bigint;
  fungibleAssets: FungibleAsset[];
  storage: string[];
  consumableNoteIds: string[];
  components: string[];
  tokenSymbol?: string;
  updatedAt: number;
};

const accountType = (account: WasmAccount, tokenSymbol?: string) => {
  if (account.isRegularAccount()) {
    return "Regular (updatable)";
  } else if (account.isFaucet()) {
    return `Fungible faucet (token symbol: ${tokenSymbol ?? "Unknown"})`;
  } else {
    return "Unknown";
  }
};

export const wasmAccountToAccount = (
  account: WasmAccount,
  name: string,
  networkId: string,
  updatedAt: number,
  consumableNoteIds: string[] = [],
  tokenSymbol?: string
): Account => ({
  id: account.id().toString(),
  name,
  address: account.id().toBech32Custom(networkId),
  type: accountType(account, tokenSymbol),
  storageMode: account.isPublic() ? "Public" : "Private",
  isPublic: account.isPublic(),
  isFaucet: account.isFaucet(),
  nonce: account.nonce().asInt(),
  fungibleAssets: account
    .vault()
    .fungibleAssets()
    .map((fungibleAsset) => ({
      faucetId: fungibleAsset.faucetId().toString(),
      amount: fungibleAsset.amount().toString(),
    })),
  storage: range(255).reduce<string[]>((previousValue, currentValue) => {
    const item = account.storage().getItem(currentValue);
    return item ? [...previousValue, item.toHex()] : previousValue;
  }, []),
  consumableNoteIds,
  components: [],
  tokenSymbol,
  updatedAt,
});

// INPUT NOTES

const noteTypes = { 1: "Public", 2: "Private", 3: "Encrypted" } as const;

type NoteType = (typeof noteTypes)[keyof typeof noteTypes];

const noteStates = {
  0: "Expected",
  1: "Unverified",
  2: "Committed",
  3: "Invalid",
  4: "Processing Authenticated",
  5: "Processing Unauthenticated",
  6: "Consumed Authenticated Local",
  7: "Consumed Unauthenticated Local",
  8: "Consumed External",
} as const;

type NoteState = (typeof noteStates)[keyof typeof noteStates];

const wellKnownNotes = {
  [NoteScript.p2id().root().toHex()]: "P2ID",
  [NoteScript.p2ide().root().toHex()]: "P2IDE",
  [NoteScript.swap().root().toHex()]: "SWAP",
} as const;

export type WellKnownNote =
  (typeof wellKnownNotes)[keyof typeof wellKnownNotes];

export type InputNote = {
  id: string;
  type: NoteType;
  state: NoteState;
  tag: string;
  senderAddress: string;
  scriptRoot: string;
  wellKnownNote?: WellKnownNote;
  fungibleAssets: FungibleAsset[];
  inputs: bigint[];
  updatedAt: number;
};

// export const noteSerialNumber = (inputNote: InputNoteRecord) =>
//   inputNote.details().recipient().serialNum();

const noteType = (metadata?: NoteMetadata) => {
  return metadata ? noteTypes[metadata.noteType()] : noteTypes[1];
};

// export const noteState = (inputNote: InputNoteRecord) =>
//   noteStates[inputNote.state()];

// export const noteTag = (inputNote: InputNoteRecord) =>
//   inputNote.metadata()?.tag().executionMode().toString() ?? "";

// export const noteSenderAddress = (
//   inputNote: InputNoteRecord,
//   networkId: string
// ) => inputNote.metadata()?.sender().toBech32Custom(networkId) ?? "";

export const noteConsumed = ({ state }: InputNote) =>
  state.includes("Consumed");

// let mut hex_string =
//   format!("0x{:016x}{:016x}", self.prefix().as_u64(), self.suffix().as_int());
// hex_string.truncate(32);
// hex_string

export const noteInputsToAccountId = (noteInputs: bigint[]) => {
  const [suffix, prefix] = noteInputs;
  if (!suffix || !prefix) {
    return AccountId.fromHex("0x000000000000000000000000000000");
  }
  const prefixString = prefix.toString(16).padStart(16, "0");
  const suffixString = suffix.toString(16).padStart(16, "0");
  return AccountId.fromHex(`0x${prefixString}${suffixString}`.slice(0, 32));
};

export const wasmInputNoteToInputNote = (
  record: InputNoteRecord,
  networkId: string
): InputNote => ({
  id: record.id().toString(),
  type: noteType(record.metadata()),
  state: noteStates[record.state()],
  tag: record.metadata()?.tag().executionMode().toString() ?? "",
  senderAddress:
    // TODO remove
    networkId === "mtst"
      ? (record.metadata()?.sender().toBech32("mtst") ?? "")
      : (record.metadata()?.sender().toBech32Custom(networkId) ?? ""),
  // senderAddress: record.metadata()?.sender().toBech32Custom(networkId) ?? "",
  scriptRoot:
    networkId === "mtst"
      ? "0x0"
      : record.details().recipient().script().root().toHex(),
  // scriptRoot: record.details().recipient().script().root().toHex(),
  wellKnownNote:
    networkId === "mtst"
      ? undefined
      : wellKnownNotes[record.details().recipient().script().root().toHex()],
  // wellKnownNote:
  //   wellKnownNotes[record.details().recipient().script().root().toHex()],
  fungibleAssets: record
    .details()
    .assets()
    .fungibleAssets()
    .map((fungibleAsset) => ({
      faucetId: fungibleAsset.faucetId().toString(),
      amount: fungibleAsset.amount().toString(),
    })),
  inputs:
    networkId === "mtst"
      ? []
      : record
          .details()
          .recipient()
          .inputs()
          .values()
          .map((value) => value.asInt()),
  // inputs: record
  //   .details()
  //   .recipient()
  //   .inputs()
  //   .values()
  //   .map((value) => value.asInt()),
  updatedAt: record.inclusionProof()?.location().blockNum() ?? 0,
});

// TRANSACTIONS

export type TransactionType = "consume" | "send" | "mint";

export type CreateTransactionDialogStep = "select" | "configure" | "preview";

export type Note = {
  id: string;
  type: NoteType;
  scriptRoot: string;
  wellKnownNote?: WellKnownNote;
  senderAddress: string;
  fungibleAssets: FungibleAsset[];
};

const wasmNoteToNote = (note: WasmNote, networkId: string): Note => ({
  id: note.id().toString(),
  type: noteType(note.metadata()),
  scriptRoot: note.recipient().script().root().toHex(),
  wellKnownNote: wellKnownNotes[note.recipient().script().root().toHex()],
  senderAddress: note.metadata()?.sender().toBech32Custom(networkId) ?? "",
  fungibleAssets: note
    .assets()
    .fungibleAssets()
    .map((fungibleAsset) => ({
      faucetId: fungibleAsset.faucetId().toString(),
      amount: fungibleAsset.amount().toString(),
    })),
});

export type Transaction = {
  id: string;
  status: string;
  accountAddress: string;
  scriptRoot: string;
  inputNotes: Note[];
  outputNotes: Note[];
  updatedAt: number;
};

const transactionStatus = (transactionRecord: TransactionRecord) => {
  const status = transactionRecord.transactionStatus();
  if (status.isPending()) {
    return "Pending";
  } else if (status.isCommitted()) {
    return `Committed (Block: ${status.getBlockNum()})`;
  } else {
    return "Discarded";
  }
};

export const wasmTransactionToTransaction = (
  record: TransactionRecord,
  result: TransactionResult,
  networkId: string
): Transaction => ({
  id: record.id().toHex(),
  status: transactionStatus(record),
  accountAddress: record.accountId().toBech32Custom(networkId),
  scriptRoot: result.transactionArguments().txScript()?.root().toHex() ?? "",
  inputNotes: range(result.executedTransaction().inputNotes().numNotes()).map(
    (index) => {
      const note = result.executedTransaction().inputNotes().getNote(index);
      return wasmNoteToNote(note.note(), networkId);
    }
  ),
  outputNotes: range(result.executedTransaction().outputNotes().numNotes())
    .map((index) => {
      const note = result.executedTransaction().outputNotes().getNote(index);
      return note.intoFull();
    })
    .filter((note) => note !== undefined)
    .map((note) => wasmNoteToNote(note, networkId)),
  updatedAt: record.blockNum(),
});

// SCRIPTS

export const scriptTypes = {
  account: "Account Script",
  transaction: "Transaction Script",
  note: "Note Script",
} as const;

export type ScriptType = keyof typeof scriptTypes;

export const scriptStatuses = {
  draft: "Draft",
  compiled: "Compiled",
} as const;

export type ScriptStatus = keyof typeof scriptStatuses;

export type Script = {
  id: string;
  name: string;
  type: ScriptType;
  status: ScriptStatus;
  rust: string;
  masm: string;
  error: string;
  updatedAt: number;
};

// COMPONENTS

export const componentTypes = {
  account: "Account Component",
  auth: "Auth Component",
} as const;

export type ComponentType = keyof typeof componentTypes;

export const storageSlotTypes = { value: "Value", map: "Storage Map" } as const;

export type StorageSlotType = keyof typeof storageSlotTypes;

export type StorageSlot = {
  name: string;
  type: StorageSlotType;
  value: string;
};

export type Component = {
  id: string;
  name: string;
  type: ComponentType;
  scriptId: string;
  storageSlots: StorageSlot[];
  updatedAt: number;
};

// STORE

type Blob = { __type: "Blob"; data: string };

type AccountCode = { root: string; code: Blob };

type AccountStorage = { root: string; slots: Blob };

type AccountVault = { root: string; assets: Blob };

type AccountAuth = { pubKey: string; secretKey: string };

type StoreAccount = {
  id: string;
  codeRoot: string;
  storageRoot: string;
  vaultRoot: string;
  nonce: string;
  committed: boolean;
  accountSeed: Blob;
  accountCommitment: string;
  locked: boolean;
};

type StateSync = { id: number; blockNum: string };

type BlockHeader = {
  blockNum: string;
  header: Blob;
  partialBlockchainPeaks: Blob;
  hasClientNotes: string;
};

type Tag = {
  id: number;
  tag: string;
  sourceNoteId: string;
  sourceAccountId: string;
};

export type Store = {
  accountCode: AccountCode[];
  accountStorage: AccountStorage[];
  accountVaults: AccountVault[];
  accountAuth: AccountAuth[];
  accounts: StoreAccount[];
  // TODO
  transactions: string[];
  transactionScripts: string[];
  inputNotes: string[];
  outputNotes: string[];
  notesScripts: string[];
  //
  stateSync: StateSync[];
  blockHeaders: BlockHeader[];
  // TODO
  partialBlockchainNodes: string[];
  //
  tags: Tag[];
  // TODO
  foreignAccountCode: string[];
};

// TUTORIALS

export type TutorialStep = {
  title: string;
  Content: FunctionComponent;
  NextStepButton?: FunctionComponent;
};

export type Tutorial = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  initialRoute: string;
  store: Store;
  state: State;
  steps: TutorialStep[];
};
