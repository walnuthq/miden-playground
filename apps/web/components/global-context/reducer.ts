import {
  type TransactionResult,
  type ConsumableNoteRecord,
} from "@workspace/mock-web-client";
import {
  type NetworkId,
  type Account,
  type Transaction,
  type InputNote,
  type TransactionType,
  type CreateTransactionDialogStep,
} from "@/lib/types";

export type State = {
  // GLOBAL
  networkId: NetworkId;
  blockNum: number;
  // ACCOUNTS
  createWalletDialogOpen: boolean;
  createFaucetDialogOpen: boolean;
  importAccountDialogOpen: boolean;
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
  blockNum: 0,
  // ACCOUNTS
  createWalletDialogOpen: false,
  createFaucetDialogOpen: false,
  importAccountDialogOpen: false,
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
  blockNum,
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
    blockNum,
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
    blockNum,
    accounts,
    transactions,
    inputNotes,
    tutorialId,
    tutorialStep,
    tutorialMaxStep,
    tutorialOpen,
    nextTutorialStepDisabled,
  } = JSON.parse(value) as {
    networkId: NetworkId;
    blockNum: number;
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
    blockNum,
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
  | { type: "RESET_STATE"; payload: { blockNum: number } }
  | {
      type: "SWITCH_NETWORK";
      payload: { networkId: NetworkId; blockNum: number };
    }
  | {
      type: "SYNC_STATE";
      payload: {
        blockNum: number;
        accounts: Account[];
        inputNotes: InputNote[];
      };
    }
  | { type: "LOAD_PROJECT"; payload: { state: State } }
  | {
      type: "NEW_ACCOUNT";
      payload: { account: Account; blockNum: number };
    }
  | {
      type: "IMPORT_ACCOUNT";
      payload: {
        account: Account;
        inputNotes: InputNote[];
        blockNum: number;
      };
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
      type: "OPEN_IMPORT_ACCOUNT_DIALOG";
    }
  | {
      type: "CLOSE_IMPORT_ACCOUNT_DIALOG";
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
        blockNum: number;
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
      return {
        ...initialState(),
        networkId: state.networkId,
        blockNum: action.payload.blockNum,
      };
    }
    case "SWITCH_NETWORK": {
      return {
        ...state,
        networkId: action.payload.networkId,
        blockNum: action.payload.blockNum,
      };
    }
    case "SYNC_STATE": {
      return {
        ...state,
        blockNum: action.payload.blockNum,
        accounts: action.payload.accounts,
        inputNotes: action.payload.inputNotes,
      };
    }
    case "LOAD_PROJECT": {
      return action.payload.state;
    }
    case "NEW_ACCOUNT": {
      return {
        ...state,
        accounts: [...state.accounts, action.payload.account],
        blockNum: action.payload.blockNum,
      };
    }
    case "IMPORT_ACCOUNT": {
      const noteIds = state.inputNotes.map(({ id }) => id);
      const filteredInputNotes = action.payload.inputNotes.filter(
        ({ id }) => !noteIds.includes(id)
      );
      return {
        ...state,
        accounts: [...state.accounts, action.payload.account],
        inputNotes: [...state.inputNotes, ...filteredInputNotes],
        blockNum: action.payload.blockNum,
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
    case "OPEN_IMPORT_ACCOUNT_DIALOG": {
      return {
        ...state,
        importAccountDialogOpen: true,
      };
    }
    case "CLOSE_IMPORT_ACCOUNT_DIALOG": {
      return {
        ...state,
        importAccountDialogOpen: false,
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
        blockNum: action.payload.blockNum,
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
