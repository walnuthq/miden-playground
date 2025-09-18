import {
  type Felt as WasmFelt,
  type Word as WasmWord,
  type AccountId as WasmAccountId,
  type OutputNote as WasmOutputNote,
  type FungibleAsset as WasmFungibleAsset,
} from "@demox-labs/miden-sdk";

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
