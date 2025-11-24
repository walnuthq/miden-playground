import {
  type Word as WasmWordType,
  type AccountId as WasmAccountIdType,
  type OutputNote as WasmOutputNoteType,
  type TransactionId as WasmTransactionIdType,
} from "@demox-labs/miden-sdk";

// MISSING TYPES

type WasmOutputNotesType = {
  free(): void;
  commitment(): WasmWordType;
  numNotes(): number;
  isEmpty(): boolean;
  getNote(index: number): WasmOutputNoteType;
  notes(): WasmOutputNoteType[];
};

type WasmTransactionStatusType = {
  free(): void;
  isPending(): boolean;
  isCommitted(): boolean;
  isDiscarded(): boolean;
  getBlockNum(): number | undefined;
  getCommitTimestamp(): bigint | undefined;
};

export type WasmTransactionRecordType = {
  free(): void;
  id(): WasmTransactionIdType;
  accountId(): WasmAccountIdType;
  initAccountState(): WasmWordType;
  finalAccountState(): WasmWordType;
  inputNoteNullifiers(): WasmWordType[];
  outputNotes(): WasmOutputNotesType;
  blockNum(): number;
  transactionStatus(): WasmTransactionStatusType;
  creationTimestamp(): bigint;
};
