import { type FunctionComponent } from "react";
import { type State } from "@/components/global-context/reducer";
import {
  type Felt as WasmFelt,
  type Word as WasmWord,
  type AccountId as WasmAccountId,
  type OutputNote as WasmOutputNote,
  type FungibleAsset as WasmFungibleAsset,
} from "@demox-labs/miden-sdk";
import { type Store } from "@/lib/store";

export const networks = {
  mtst: "Testnet",
  mlcl: "Sandbox",
} as const;

export type NetworkId = keyof typeof networks;

// ACCOUNTS

export const accountTypes = {
  "fungible-faucet": "Fungible Faucet",
  "non-fungible-faucet": "Non Fungible Faucet",
  "regular-account-immutable-code": "Regular (immutable)",
  "regular-account-updatable-code": "Regular (updatable)",
} as const;

export type AccountType = keyof typeof accountTypes;

export const accountStorageModes = {
  private: "Private",
  public: "Public",
  network: "Network",
} as const;

export type AccountStorageMode = keyof typeof accountStorageModes;

export type FungibleAsset = { faucetId: string; amount: string };

export type Account = {
  id: string;
  name: string;
  address: string;
  type: AccountType;
  storageMode: AccountStorageMode;
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

// INPUT NOTES

export const noteTypes = {
  public: "Public",
  private: "Private",
  encrypted: "Encrypted",
} as const;

export type NoteType = keyof typeof noteTypes;

export const noteStates = {
  expected: "Expected",
  unverified: "Unverified",
  committed: "Committed",
  invalid: "Invalid",
  "processing-authenticated": "Processing Authenticated",
  "processing-unauthenticated": "Processing Unauthenticated",
  "consumed-authenticated-local": "Consumed Authenticated Local",
  "consumed-unauthenticated-local": "Consumed Unauthenticated Local",
  "consumed-external": "Consumed External",
} as const;

type NoteState = keyof typeof noteStates;

export type InputNote = {
  id: string;
  type: NoteType;
  state: NoteState;
  tag: string;
  senderId: string;
  scriptRoot: string;
  fungibleAssets: FungibleAsset[];
  inputs: bigint[];
  updatedAt: number;
};

// export const noteSerialNumber = (inputNote: InputNoteRecord) =>
//   inputNote.details().recipient().serialNum();

// export const noteTag = (inputNote: InputNoteRecord) =>
//   inputNote.metadata()?.tag().executionMode().toString() ?? "";

// export const noteSenderAddress = (
//   inputNote: InputNoteRecord,
//   networkId: string
// ) => inputNote.metadata()?.sender().toBech32Custom(networkId) ?? "";

export const noteConsumed = ({ state }: InputNote) =>
  state.includes("consumed");

// TRANSACTIONS

export type TransactionType = "consume" | "send" | "mint";

export type CreateTransactionDialogStep = "select" | "configure" | "preview";

export type Note = {
  id: string;
  type: NoteType;
  scriptRoot: string;
  senderId: string;
  fungibleAssets: FungibleAsset[];
};

export type Transaction = {
  id: string;
  status: string;
  accountId: string;
  scriptRoot: string;
  inputNotes: Note[];
  outputNotes: Note[];
  updatedAt: number;
};

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
  root: string;
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

// MISSING TYPES

export type WasmTransactionId = {
  free(): void;
  asElements(): WasmFelt[];
  asBytes(): Uint8Array;
  toHex(): string;
  inner(): WasmWord;
};

type WasmOutputNotes = {
  free(): void;
  commitment(): WasmWord;
  numNotes(): number;
  isEmpty(): boolean;
  getNote(index: number): WasmOutputNote;
  notes(): WasmOutputNote[];
};

type WasmTransactionStatus = {
  free(): void;
  isPending(): boolean;
  isCommitted(): boolean;
  isDiscarded(): boolean;
  getBlockNum(): number | undefined;
  getCommitTimestamp(): bigint | undefined;
};

export type WasmTransactionRecord = {
  free(): void;
  id(): WasmTransactionId;
  accountId(): WasmAccountId;
  initAccountState(): WasmWord;
  finalAccountState(): WasmWord;
  inputNoteNullifiers(): WasmWord[];
  outputNotes(): WasmOutputNotes;
  blockNum(): number;
  transactionStatus(): WasmTransactionStatus;
  creationTimestamp(): bigint;
};

export type WasmAssetVault = {
  free(): void;
  root(): WasmWord;
  getBalance(faucet_id: WasmAccountId): bigint;
  fungibleAssets(): WasmFungibleAsset[];
};
