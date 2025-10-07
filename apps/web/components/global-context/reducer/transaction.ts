import {
  type ConsumableNoteRecord as WasmConsumableNoteRecord,
  type TransactionResult as WasmTransactionResult,
} from "@demox-labs/miden-sdk";
import { type Account } from "@/lib/types/account";
import { type InputNote } from "@/lib/types/note";
import {
  type Transaction,
  type TransactionType,
  type CreateTransactionDialogStep,
} from "@/lib/types/transaction";
import { type State } from "@/lib/types/state";

export type TransactionAction =
  | {
      type: "OPEN_CREATE_TRANSACTION_DIALOG";
      payload: {
        accountId: string;
        transactionType: TransactionType;
        transactionResult: WasmTransactionResult | null;
        step: CreateTransactionDialogStep;
        consumableNotes: WasmConsumableNoteRecord[];
        noteIds: string[];
      };
    }
  | {
      type: "CLOSE_CREATE_TRANSACTION_DIALOG";
    }
  | {
      type: "SUBMIT_TRANSACTION";
      payload: {
        transaction: Transaction;
        account: Account;
        consumableNoteIds: Record<string, string[]>;
        inputNotes: InputNote[];
        blockNum: number;
        serializedMockChain: Uint8Array | null;
      };
    };

const reducer = (state: State, action: TransactionAction): State => {
  switch (action.type) {
    case "OPEN_CREATE_TRANSACTION_DIALOG": {
      return {
        ...state,
        createTransactionDialogOpen: true,
        createTransactionDialogAccountId: action.payload.accountId,
        createTransactionDialogTransactionType: action.payload.transactionType,
        createTransactionDialogStep: action.payload.step,
        createTransactionDialogConsumableNotes: action.payload.consumableNotes,
        createTransactionDialogNoteIds: action.payload.noteIds,
        createTransactionDialogTransactionResult:
          action.payload.transactionResult,
      };
    }
    case "CLOSE_CREATE_TRANSACTION_DIALOG": {
      return {
        ...state,
        createTransactionDialogOpen: false,
        createTransactionDialogAccountId: "",
        createTransactionDialogTransactionType: "consume",
        createTransactionDialogStep: "select",
        createTransactionDialogConsumableNotes: [],
        createTransactionDialogNoteIds: [],
        createTransactionDialogTransactionResult: null,
      };
    }
    case "SUBMIT_TRANSACTION": {
      const index = state.accounts.findIndex(
        ({ id }) => id === action.payload.account.id
      );
      return {
        ...state,
        transactions: [...state.transactions, action.payload.transaction],
        accounts: [
          ...state.accounts.slice(0, index).map((account) => ({
            ...account,
            consumableNoteIds:
              action.payload.consumableNoteIds[account.id] ?? [],
          })),
          action.payload.account,
          ...state.accounts.slice(index + 1).map((account) => ({
            ...account,
            consumableNoteIds:
              action.payload.consumableNoteIds[account.id] ?? [],
          })),
        ],
        inputNotes: action.payload.inputNotes,
        blockNum: action.payload.blockNum,
        serializedMockChain: action.payload.serializedMockChain,
      };
    }
  }
};

export default reducer;
