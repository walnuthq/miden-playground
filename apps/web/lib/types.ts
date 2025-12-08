import type * as MidenSdkNs from "@demox-labs/miden-sdk";

export type MidenSdk = typeof MidenSdkNs;

export type Buffer = { type: "Buffer"; data: number[] };

// MISSING TYPES

type WasmOutputNotesType = {
  free(): void;
  commitment(): MidenSdkNs.Word;
  numNotes(): number;
  isEmpty(): boolean;
  getNote(index: number): MidenSdkNs.OutputNote;
  notes(): MidenSdkNs.OutputNote[];
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
  id(): MidenSdkNs.TransactionId;
  accountId(): MidenSdkNs.AccountId;
  initAccountState(): MidenSdkNs.Word;
  finalAccountState(): MidenSdkNs.Word;
  inputNoteNullifiers(): MidenSdkNs.Word[];
  outputNotes(): WasmOutputNotesType;
  blockNum(): number;
  transactionStatus(): WasmTransactionStatusType;
  creationTimestamp(): bigint;
};
