import {
  SyncSummary,
  type TransactionResult,
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
  tutorialMaxStep: number;
  tutorialOpen: boolean;
  nextTutorialStepDisabled: boolean;
};

export const initialState = (): State => ({
  // GLOBAL
  networkId: "mlcl",
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
  tutorialMaxStep: 0,
  tutorialOpen: true,
  nextTutorialStepDisabled: true,
});

export const stateSerializer = ({
  networkId,
  syncSummary,
  accounts,
  transactions,
  inputNotes,
  tutorialId,
  tutorialStep,
  tutorialMaxStep,
  tutorialOpen,
  nextTutorialStepDisabled,
}: State) =>
  JSON.stringify({
    networkId,
    syncSummary: syncSummary ? syncSummary.serialize().toString() : null,
    accounts: accounts.map((account) => ({
      ...account,
      nonce: account.nonce.toString(),
    })),
    transactions,
    inputNotes: inputNotes.map((inputNote) => ({
      ...inputNote,
      inputs: inputNote.inputs.map((input) => input.toString()),
    })),
    tutorialId,
    tutorialStep,
    tutorialMaxStep,
    tutorialOpen,
    nextTutorialStepDisabled,
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
    tutorialMaxStep,
    tutorialOpen,
    nextTutorialStepDisabled,
  } = JSON.parse(value) as {
    networkId: string;
    syncSummary: string | null;
    accounts: (Omit<Account, "nonce"> & { nonce: string })[];
    transactions: Transaction[];
    inputNotes: (Omit<InputNote, "inputs"> & { inputs: string[] })[];
    tutorialId: string;
    tutorialStep: number;
    tutorialMaxStep: number;
    tutorialOpen: boolean;
    nextTutorialStepDisabled: boolean;
  };
  return {
    ...initialState(),
    networkId,
    syncSummary: syncSummary
      ? SyncSummary.deserialize(
          Uint8Array.from(syncSummary.split(",").map((byte) => Number(byte)))
        )
      : null,
    accounts: accounts.map((account) => ({
      ...account,
      nonce: BigInt(account.nonce),
    })),
    transactions,
    inputNotes: inputNotes.map((inputNote) => ({
      ...inputNote,
      inputs: inputNote.inputs.map((input) => BigInt(input)),
    })),
    tutorialId,
    tutorialStep,
    tutorialMaxStep,
    tutorialOpen,
    nextTutorialStepDisabled,
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
        consumableNoteIds: Record<string, string[]>;
        inputNotes: InputNote[];
        syncSummary: SyncSummary;
      };
    }
  | {
      type: "START_TUTORIAL";
      payload: { tutorialId: string };
    }
  | { type: "PREVIOUS_TUTORIAL_STEP" }
  | { type: "NEXT_TUTORIAL_STEP" }
  | { type: "SET_TUTORIAL_STEP"; payload: { tutorialStep: number } }
  | { type: "OPEN_TUTORIAL" }
  | { type: "CLOSE_TUTORIAL" }
  | {
      type: "SET_NEXT_TUTORIAL_STEP_DISABLED";
      payload: { disabled: boolean };
    };

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
        syncSummary: action.payload.syncSummary,
      };
    }
    case "START_TUTORIAL": {
      return {
        ...initialState(),
        tutorialId: action.payload.tutorialId,
        tutorialStep: 0,
        tutorialMaxStep: 0,
      };
    }
    case "PREVIOUS_TUTORIAL_STEP": {
      return {
        ...state,
        tutorialStep: state.tutorialStep - 1,
      };
    }
    case "NEXT_TUTORIAL_STEP": {
      return {
        ...state,
        tutorialStep: state.tutorialStep + 1,
        tutorialMaxStep: state.tutorialStep + 1,
      };
    }
    case "SET_TUTORIAL_STEP": {
      return {
        ...state,
        tutorialStep: action.payload.tutorialStep,
      };
    }
    case "OPEN_TUTORIAL": {
      return {
        ...state,
        tutorialOpen: true,
      };
    }
    case "CLOSE_TUTORIAL": {
      return {
        ...state,
        tutorialOpen: false,
      };
    }
    case "SET_NEXT_TUTORIAL_STEP_DISABLED": {
      return {
        ...state,
        nextTutorialStepDisabled: action.payload.disabled,
      };
    }
    default: {
      return state;
    }
  }
};
