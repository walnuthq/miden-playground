import { type FungibleAsset } from "@/lib/types/asset";
import { P2ID_NOTE_CODE } from "@/lib/constants";
import { accountIdFromPrefixSuffix } from "@/lib/types/account";

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
    const recipientAccountId = accountIdFromPrefixSuffix(
      inputNote.inputs[1]!,
      inputNote.inputs[0]!
    );
    return accountId === recipientAccountId;
  } else {
    return true;
  }
};
