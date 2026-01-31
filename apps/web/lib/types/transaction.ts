import { type FungibleAsset } from "@/lib/types/asset";
import { type NoteType } from "@/lib/types/note";

export const transactionTypes = {
  mint: "Mint",
  consume: "Consume notes",
  send: "Send",
  custom: "Custom",
} as const;

export type TransactionType = keyof typeof transactionTypes;

export type CreateTransactionDialogStep = "select" | "configure" | "preview";

export type TransactionNote = {
  id: string;
  type: NoteType;
  scriptRoot: string;
  senderId: string;
  fungibleAssets: FungibleAsset[];
  inputs: string[];
};

export type Transaction = {
  id: string;
  status: string;
  accountId: string;
  scriptRoot: string;
  inputNotes: TransactionNote[];
  outputNotes: TransactionNote[];
  updatedAt: number;
};
