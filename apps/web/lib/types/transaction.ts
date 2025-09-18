import { type FungibleAsset } from "@/lib/types/asset";
import { type NoteType } from "@/lib/types/note";

export type TransactionType = "consume" | "send" | "mint";

export type CreateTransactionDialogStep = "select" | "configure" | "preview";

export type TransactionNote = {
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
  inputNotes: TransactionNote[];
  outputNotes: TransactionNote[];
  updatedAt: number;
};
