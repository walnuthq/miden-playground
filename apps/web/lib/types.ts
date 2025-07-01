import { type ReactNode, type FunctionComponent } from "react";
import {
  NetworkId,
  type Account as WasmAccount,
  type TransactionRecord,
  type InputNoteRecord,
  NoteScript,
  type NoteInputs,
  AccountId,
} from "@workspace/mock-web-client";

export type Account = {
  account: WasmAccount;
  name: string;
  id: string;
  address: string;
  tokenSymbol?: string;
  updatedAt: number;
};

export type TableAccount = {
  id: string;
  name: string;
  address: string;
  type: string;
  storageMode: "Public" | "Private";
  nonce: bigint;
};

const accountType = ({ account, tokenSymbol }: Account) => {
  if (account.isRegularAccount()) {
    return "Regular (updatable)";
  } else if (account.isFaucet()) {
    return `Fungible faucet (token symbol: ${tokenSymbol ?? "Unknown"})`;
  } else {
    return "Unknown";
  }
};

export const accountToTableAccount = (account: Account): TableAccount => ({
  id: account.id,
  name: account.name,
  address: account.address,
  type: accountType(account),
  storageMode: account.account.isPublic() ? "Public" : "Private",
  nonce: account.account.nonce().asInt(),
});

export type TransactionType = "consume" | "send" | "mint";

export type CreateTransactionDialogStep = "select" | "configure" | "preview";

export type Transaction = {
  record: TransactionRecord;
  scriptRoot: string;
  inputNotesCount: number;
  outputNotesCount: number;
  updatedAt: number;
};

export type TableTransaction = {
  id: string;
  status: string;
  accountAddress: string;
  scriptRoot: string;
  inputNotesCount: number;
  outputNotesCount: number;
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

export const transactionToTableTransaction = (
  { record, scriptRoot, inputNotesCount, outputNotesCount }: Transaction,
  networkId: string
): TableTransaction => ({
  id: record.id().toHex(),
  status: transactionStatus(record),
  accountAddress: record.accountId().toBech32(NetworkId.tryFromStr(networkId)),
  scriptRoot,
  inputNotesCount,
  outputNotesCount,
});

export type InputNote = {
  inputNote: InputNoteRecord;
  updatedAt: number;
};

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

export type TableInputNote = {
  id: string;
  type: NoteType;
  state: NoteState;
  tag: string;
  senderAddress: string;
};

const wellKnownNotes = {
  [NoteScript.p2id().root().toHex()]: "P2ID",
  [NoteScript.p2idr().root().toHex()]: "P2IDR",
  [NoteScript.swap().root().toHex()]: "SWAP",
} as const;

export const noteWellKnownNote = (inputNote: InputNoteRecord) =>
  wellKnownNotes[noteScriptRoot(inputNote)];

export const noteScriptRoot = (inputNote: InputNoteRecord) =>
  inputNote.details().recipient().script().root().toHex();

// export const noteSerialNumber = (inputNote: InputNoteRecord) =>
//   inputNote.details().recipient().serialNum();

export const noteType = (inputNote: InputNoteRecord) => {
  const metadata = inputNote.metadata();
  return metadata ? noteTypes[metadata.noteType()] : noteTypes[1];
};

export const noteState = (inputNote: InputNoteRecord) =>
  noteStates[inputNote.state()];

export const noteTag = (inputNote: InputNoteRecord) =>
  inputNote.metadata()?.tag().executionMode().toString() ?? "";

export const noteSenderAddress = (
  inputNote: InputNoteRecord,
  networkId: string
) =>
  inputNote.metadata()?.sender().toBech32(NetworkId.tryFromStr(networkId)) ??
  "";

export const noteConsumed = (inputNote: InputNoteRecord) =>
  noteState(inputNote).includes("Consumed");

// let mut hex_string =
//   format!("0x{:016x}{:016x}", self.prefix().as_u64(), self.suffix().as_int());
// hex_string.truncate(32);
// hex_string

export const noteInputsToAccountId = (noteInputs: NoteInputs) => {
  const [suffix, prefix] = noteInputs.values();
  if (!suffix || !prefix) {
    return AccountId.fromHex("0x000000000000000000000000000000");
  }
  const prefixString = prefix.asInt().toString(16).padStart(16, "0");
  const suffixString = suffix.asInt().toString(16).padStart(16, "0");
  return AccountId.fromHex(`0x${prefixString}${suffixString}`.slice(0, 32));
};

export const inputNoteToTableInputNote = (
  inputNote: InputNote,
  networkId: string
): TableInputNote => ({
  id: inputNote.inputNote.id().toString(),
  type: noteType(inputNote.inputNote),
  state: noteState(inputNote.inputNote),
  tag: noteTag(inputNote.inputNote),
  senderAddress: noteSenderAddress(inputNote.inputNote, networkId),
});

export type TutorialStep = {
  content: ReactNode;
  NextStepButton: FunctionComponent;
};

export type Tutorial = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  initialRoute: string;
  storeDump: string;
  state: string;
  steps: TutorialStep[];
};
