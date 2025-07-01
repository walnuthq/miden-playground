import {
  TransactionRecord,
  Account as WasmAccount,
  NetworkId,
  SyncSummary,
  type TransactionResult,
  InputNoteRecord,
  type ConsumableNoteRecord,
} from "@workspace/mock-web-client";
import {
  type Account,
  type Transaction,
  type InputNote,
  type TransactionType,
  type CreateTransactionDialogStep,
} from "@/lib/types";

export type State = {
  // GLOBAL
  networkId: string;
  syncSummary: SyncSummary | null;
  // ACCOUNTS
  createWalletDialogOpen: boolean;
  createFaucetDialogOpen: boolean;
  accounts: Account[];
  // TRANSACTIONS
  createTransactionDialogOpen: boolean;
  createTransactionDialogAccountId: string;
  createTransactionDialogTransactionType: TransactionType;
  createTransactionDialogConsumableNotes: ConsumableNoteRecord[];
  createTransactionDialogNoteIds: string[];
  createTransactionDialogStep: CreateTransactionDialogStep;
  createTransactionDialogTransactionResult: TransactionResult | null;
  transactions: Transaction[];
  // NOTES
  inputNotes: InputNote[];
  // TUTORIALS
  tutorialId: string;
  tutorialStep: number;
};

export const initialState = (): State => ({
  // GLOBAL
  networkId: new NetworkId("mlcl").asStr(),
  syncSummary: null,
  // ACCOUNTS
  createWalletDialogOpen: false,
  createFaucetDialogOpen: false,
  accounts: [],
  // TRANSACTIONS
  createTransactionDialogOpen: false,
  createTransactionDialogAccountId: "",
  createTransactionDialogTransactionType: "consume",
  createTransactionDialogStep: "select",
  createTransactionDialogConsumableNotes: [],
  createTransactionDialogNoteIds: [],
  createTransactionDialogTransactionResult: null,
  transactions: [],
  // NOTES
  inputNotes: [],
  // TUTORIALS
  tutorialId: "",
  tutorialStep: 0,
});

export const stateSerializer = ({
  networkId,
  syncSummary,
  accounts,
  transactions,
  inputNotes,
  tutorialId,
  tutorialStep,
}: State) =>
  JSON.stringify({
    networkId,
    syncSummary: syncSummary ? syncSummary.serialize().toString() : null,
    accounts: accounts.map(
      ({ account, name, id, address, tokenSymbol, updatedAt }) => ({
        account: account.serialize().toString(),
        name,
        id,
        address,
        tokenSymbol,
        updatedAt,
      })
    ),
    transactions: transactions.map(
      ({
        record,
        scriptRoot,
        inputNotesCount,
        outputNotesCount,
        updatedAt,
      }) => ({
        record: record.serialize().toString(),
        scriptRoot,
        inputNotesCount,
        outputNotesCount,
        updatedAt,
      })
    ),
    inputNotes: inputNotes.map(({ inputNote, updatedAt }) => ({
      inputNote: inputNote.serialize().toString(),
      updatedAt,
    })),
    tutorialId,
    tutorialStep,
  });

export const stateDeserializer = (value: string): State => {
  const {
    networkId,
    syncSummary,
    accounts,
    transactions,
    inputNotes,
    tutorialId,
    tutorialStep,
  } = JSON.parse(value) as {
    networkId: string;
    syncSummary: string | null;
    accounts: {
      account: string;
      name: string;
      id: string;
      address: string;
      tokenSymbol: string;
      updatedAt: number;
    }[];
    transactions: {
      record: string;
      scriptRoot: string;
      inputNotesCount: number;
      outputNotesCount: number;
      updatedAt: number;
    }[];
    inputNotes: { inputNote: string; updatedAt: number }[];
    tutorialId: string;
    tutorialStep: number;
  };
  return {
    ...initialState(),
    networkId,
    syncSummary: syncSummary
      ? SyncSummary.deserialize(
          Uint8Array.from(syncSummary.split(",").map((byte) => Number(byte)))
        )
      : null,
    accounts: accounts.map(
      ({ account, name, id, address, tokenSymbol, updatedAt }) => ({
        account: WasmAccount.deserialize(
          Uint8Array.from(account.split(",").map((byte) => Number(byte)))
        ),
        name,
        id,
        address,
        tokenSymbol,
        updatedAt,
      })
    ),
    transactions: transactions.map(
      ({
        record,
        scriptRoot,
        inputNotesCount,
        outputNotesCount,
        updatedAt,
      }) => ({
        record: TransactionRecord.deserialize(
          Uint8Array.from(record.split(",").map((byte) => Number(byte)))
        ),
        scriptRoot,
        inputNotesCount,
        outputNotesCount,
        updatedAt,
      })
    ),
    inputNotes: inputNotes.map(({ inputNote, updatedAt }) => ({
      inputNote: InputNoteRecord.deserialize(
        Uint8Array.from(inputNote.split(",").map((byte) => Number(byte)))
      ),
      updatedAt,
    })),
    tutorialId,
    tutorialStep,
  };
};

export type Action =
  | { type: "RESET_STATE" }
  | { type: "LOAD_PROJECT"; payload: { state: State } }
  | {
      type: "NEW_ACCOUNT";
      payload: { account: Account; syncSummary: SyncSummary | null };
    }
  | {
      type: "OPEN_CREATE_WALLET_DIALOG";
    }
  | {
      type: "CLOSE_CREATE_WALLET_DIALOG";
    }
  | {
      type: "OPEN_CREATE_FAUCET_DIALOG";
    }
  | {
      type: "CLOSE_CREATE_FAUCET_DIALOG";
    }
  | {
      type: "OPEN_CREATE_TRANSACTION_DIALOG";
      payload: {
        accountId: string;
        transactionType: TransactionType;
        transactionResult: TransactionResult | null;
        step: CreateTransactionDialogStep;
        consumableNotes: ConsumableNoteRecord[];
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
        inputNotes: InputNote[];
        syncSummary: SyncSummary;
      };
    }
  | {
      type: "START_TUTORIAL";
      payload: { tutorialId: string };
    }
  | { type: "NEXT_TUTORIAL_STEP" };

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "RESET_STATE": {
      return initialState();
    }
    case "LOAD_PROJECT": {
      return action.payload.state;
    }
    case "NEW_ACCOUNT": {
      return {
        ...state,
        accounts: [...state.accounts, action.payload.account],
        syncSummary: action.payload.syncSummary,
      };
    }
    case "OPEN_CREATE_WALLET_DIALOG": {
      return {
        ...state,
        createWalletDialogOpen: true,
      };
    }
    case "CLOSE_CREATE_WALLET_DIALOG": {
      return {
        ...state,
        createWalletDialogOpen: false,
      };
    }
    case "OPEN_CREATE_FAUCET_DIALOG": {
      return {
        ...state,
        createFaucetDialogOpen: true,
      };
    }
    case "CLOSE_CREATE_FAUCET_DIALOG": {
      return {
        ...state,
        createFaucetDialogOpen: false,
      };
    }
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
          ...state.accounts.slice(0, index),
          action.payload.account,
          ...state.accounts.slice(index + 1),
        ],
        inputNotes: action.payload.inputNotes,
        syncSummary: action.payload.syncSummary,
      };
    }
    case "START_TUTORIAL": {
      return {
        ...initialState(),
        tutorialId: action.payload.tutorialId,
        tutorialStep: 0,
      };
    }
    case "NEXT_TUTORIAL_STEP": {
      return {
        ...state,
        tutorialStep: state.tutorialStep + 1,
      };
    }
    default: {
      return state;
    }
  }
};
