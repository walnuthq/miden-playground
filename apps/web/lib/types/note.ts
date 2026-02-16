import { type FungibleAsset } from "@/lib/types/asset";

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

export type NoteState = keyof typeof noteStates;

export type InputNote = {
  id: string;
  type: NoteType;
  state: NoteState;
  tag: string;
  serialNum: string;
  senderId: string;
  scriptRoot: string;
  scriptId: string;
  fungibleAssets: FungibleAsset[];
  inputs: string[];
  nullifier: string;
  updatedAt: number;
};

export const defaultInputNote = (): InputNote => ({
  id: "",
  type: "public",
  state: "committed",
  tag: "",
  serialNum: "",
  senderId: "",
  scriptRoot: "",
  scriptId: "",
  fungibleAssets: [],
  inputs: [],
  nullifier: "",
  updatedAt: 0,
});

export const noteConsumed = ({ state }: InputNote) =>
  state.includes("consumed");
