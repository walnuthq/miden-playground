import type {
  ConsumableNoteRecord as WasmConsumableNoteRecordType,
  TransactionRequest as WasmTransactionRequestType,
  TransactionResult as WasmTransactionResultType,
} from "@miden-sdk/miden-sdk";
import type { Account } from "@/lib/types/account";
import type { State } from "@/lib/types/state";
import type {
  CreateTransactionDialogStep,
  Transaction,
  TransactionType,
} from "@/lib/types/transaction";

export type TransactionAction =
  | {
      type: "OPEN_CREATE_TRANSACTION_DIALOG";
      payload: {
        accountId: string;
        transactionType: TransactionType;
        step: CreateTransactionDialogStep;
        consumableNotes: WasmConsumableNoteRecordType[];
        noteIds: string[];
        transactionRequest: WasmTransactionRequestType | null;
        transactionResult: WasmTransactionResultType | null;
      };
    }
  | {
      type: "CLOSE_CREATE_TRANSACTION_DIALOG";
    }
  | { type: "SUBMITTING_TRANSACTION" }
  | { type: "TRANSACTION_SUBMITTED" }
  | {
      type: "SUBMIT_TRANSACTION";
      payload: {
        transaction: Transaction;
        account: Account;
        // serializedMockChain: Uint8Array;
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
        createTransactionDialogTransactionRequest:
          action.payload.transactionRequest,
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
    case "SUBMITTING_TRANSACTION": {
      return { ...state, submittingTransaction: true };
    }
    case "TRANSACTION_SUBMITTED": {
      return { ...state, submittingTransaction: false };
    }
    case "SUBMIT_TRANSACTION": {
      const index = state.accounts.findIndex(
        ({ id }) => id === action.payload.account.id,
      );
      const current = state.accounts[index];
      if (!current) {
        // The account was deleted while its transaction was running.
        return {
          ...state,
          submittingTransaction: false,
          transactions: [...state.transactions, action.payload.transaction],
        };
      }
      // The payload's account is rebuilt from the store, which doesn't hold
      // its multisig data or the notes it can consume: keep the current ones,
      // minus the notes this transaction consumed.
      const consumedNoteIds = action.payload.transaction.inputNotes.map(
        ({ id }) => id,
      );
      const account = {
        ...action.payload.account,
        multisig: current.multisig,
        consumableNoteIds: current.consumableNoteIds.filter(
          (id) => !consumedNoteIds.includes(id),
        ),
      };
      return {
        ...state,
        submittingTransaction: false,
        transactions: [...state.transactions, action.payload.transaction],
        accounts: [
          ...state.accounts.slice(0, index),
          account,
          ...state.accounts.slice(index + 1),
        ],
        // serializedMockChain: action.payload.serializedMockChain,
      };
    }
  }
};

export default reducer;
