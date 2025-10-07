import { type FungibleAsset } from "@/lib/types/asset";
import { P2ID_NOTE_CODE, ZERO_ACCOUNT_ID } from "@/lib/constants";

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
  nullifier: string;
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

export const noteConsumable = ({
  inputNote,
  networkId,
  accountId,
}: {
  inputNote: InputNote;
  networkId: string;
  accountId?: string;
}) => {
  if (noteConsumed(inputNote) || inputNote.scriptRoot !== P2ID_NOTE_CODE) {
    return false;
  }
  if (networkId === "mtst") {
    const recipientAccountId = noteInputsToAccountId(inputNote.inputs);
    return accountId === recipientAccountId;
  } else {
    return true;
  }
};

export const noteInputsToAccountId = (noteInputs: bigint[]) => {
  const [suffix, prefix] = noteInputs;
  if (!suffix || !prefix) {
    return ZERO_ACCOUNT_ID;
  }
  const prefixString = prefix.toString(16).padStart(16, "0");
  const suffixString = suffix.toString(16).padStart(16, "0");
  return `0x${prefixString}${suffixString}`.slice(0, 32);
};
