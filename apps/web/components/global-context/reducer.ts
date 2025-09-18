import {
  type ConsumableNoteRecord as WasmConsumableNoteRecord,
  type TransactionResult as WasmTransactionResult,
} from "@demox-labs/miden-sdk";
import { type Account } from "@/lib/types/account";
import { type NetworkId } from "@/lib/types/network";
import { type InputNote } from "@/lib/types/note";
import {
  type Transaction,
  type TransactionType,
  type CreateTransactionDialogStep,
} from "@/lib/types/transaction";
import { type Script } from "@/lib/types/script";
import { type Component } from "@/lib/types/component";
import defaultScripts from "@/components/global-context/default-scripts";
import defaultComponents from "@/components/global-context/default-components";

export type State = {
  // GLOBAL
  networkId: NetworkId;
  blockNum: number;
  serializedMockChain: Uint8Array | null;
  // ACCOUNTS
  createWalletDialogOpen: boolean;
  createFaucetDialogOpen: boolean;
  importAccountDialogOpen: boolean;
  deployAccountDialogOpen: boolean;
  accounts: Account[];
  // TRANSACTIONS
  createTransactionDialogOpen: boolean;
  createTransactionDialogAccountId: string;
  createTransactionDialogTransactionType: TransactionType;
  createTransactionDialogConsumableNotes: WasmConsumableNoteRecord[];
  createTransactionDialogNoteIds: string[];
  createTransactionDialogStep: CreateTransactionDialogStep;
  createTransactionDialogTransactionResult: WasmTransactionResult | null;
  transactions: Transaction[];
  // NOTES
  inputNotes: InputNote[];
  // SCRIPTS
  createScriptDialogOpen: boolean;
  deleteScriptAlertDialogOpen: boolean;
  deleteScriptAlertDialogScriptId: string;
  scripts: Script[];
  // COMPONENTS
  createComponentDialogOpen: boolean;
  upsertStorageSlotDialogOpen: boolean;
  upsertStorageSlotDialogComponentId: string;
  upsertStorageSlotDialogStorageSlotIndex: number;
  components: Component[];
  // TUTORIALS
  tutorialId: string;
  tutorialLoaded: boolean;
  tutorialStep: number;
  tutorialMaxStep: number;
  tutorialOpen: boolean;
  nextTutorialStepDisabled: boolean;
};

export const initialState = (): State => ({
  // GLOBAL
  networkId: "mtst",
  blockNum: 0,
  serializedMockChain: null,
  // ACCOUNTS
  createWalletDialogOpen: false,
  createFaucetDialogOpen: false,
  importAccountDialogOpen: false,
  deployAccountDialogOpen: false,
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
  // SCRIPTS
  createScriptDialogOpen: false,
  deleteScriptAlertDialogOpen: false,
  deleteScriptAlertDialogScriptId: "",
  scripts: defaultScripts,
  // COMPONENTS
  createComponentDialogOpen: false,
  upsertStorageSlotDialogOpen: false,
  upsertStorageSlotDialogComponentId: "",
  upsertStorageSlotDialogStorageSlotIndex: -1,
  components: defaultComponents,
  // TUTORIALS
  tutorialId: "",
  tutorialLoaded: false,
  tutorialStep: 0,
  tutorialMaxStep: 0,
  tutorialOpen: true,
  nextTutorialStepDisabled: true,
});

export const stateSerializer = ({
  networkId,
  blockNum,
  serializedMockChain,
  accounts,
  transactions,
  inputNotes,
  scripts,
  components,
  tutorialId,
  tutorialLoaded,
  tutorialStep,
  tutorialMaxStep,
  tutorialOpen,
  nextTutorialStepDisabled,
}: State) =>
  JSON.stringify({
    networkId,
    blockNum,
    serializedMockChain:
      serializedMockChain === null ? null : serializedMockChain.toString(),
    accounts: accounts.map((account) => ({
      ...account,
      nonce: account.nonce.toString(),
    })),
    transactions,
    inputNotes: inputNotes.map((inputNote) => ({
      ...inputNote,
      inputs: inputNote.inputs.map((input) => input.toString()),
    })),
    scripts,
    components,
    tutorialId,
    tutorialLoaded,
    tutorialStep,
    tutorialMaxStep,
    tutorialOpen,
    nextTutorialStepDisabled,
  });

export const stateDeserializer = (value: string): State => {
  try {
    const {
      networkId,
      blockNum,
      serializedMockChain,
      accounts,
      transactions,
      inputNotes,
      scripts,
      components,
      tutorialId,
      tutorialLoaded,
      tutorialStep,
      tutorialMaxStep,
      tutorialOpen,
      nextTutorialStepDisabled,
    } = JSON.parse(value) as {
      networkId?: NetworkId;
      blockNum?: number;
      serializedMockChain?: string | null;
      accounts?: (Omit<Account, "nonce"> & { nonce: string })[];
      transactions?: Transaction[];
      inputNotes?: (Omit<InputNote, "inputs"> & { inputs: string[] })[];
      scripts?: Script[];
      components?: Component[];
      tutorialId?: string;
      tutorialLoaded?: boolean;
      tutorialStep?: number;
      tutorialMaxStep?: number;
      tutorialOpen?: boolean;
      nextTutorialStepDisabled?: boolean;
    };
    const state = initialState();
    return {
      ...state,
      networkId: networkId ?? state.networkId,
      blockNum: blockNum ?? state.blockNum,
      serializedMockChain:
        serializedMockChain === null || serializedMockChain === undefined
          ? null
          : new Uint8Array(serializedMockChain.split(",").map(Number)),
      accounts: accounts
        ? accounts.map((account) => ({
            ...account,
            nonce: BigInt(account.nonce),
          }))
        : state.accounts,
      transactions: transactions ?? state.transactions,
      inputNotes: inputNotes
        ? inputNotes.map((inputNote) => ({
            ...inputNote,
            inputs: inputNote.inputs.map((input) => BigInt(input)),
          }))
        : state.inputNotes,
      scripts: scripts ?? state.scripts,
      components: components ?? state.components,
      tutorialId: tutorialId ?? state.tutorialId,
      tutorialLoaded: tutorialLoaded ?? state.tutorialLoaded,
      tutorialStep: tutorialStep ?? state.tutorialStep,
      tutorialMaxStep: tutorialMaxStep ?? state.tutorialMaxStep,
      tutorialOpen: tutorialOpen ?? state.tutorialOpen,
      nextTutorialStepDisabled:
        nextTutorialStepDisabled ?? state.nextTutorialStepDisabled,
    };
  } catch (error) {
    console.error(error);
    return initialState();
  }
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
      type: "OPEN_DEPLOY_ACCOUNT_DIALOG";
    }
  | {
      type: "CLOSE_DEPLOY_ACCOUNT_DIALOG";
    }
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
    }
  | {
      type: "OPEN_CREATE_SCRIPT_DIALOG";
    }
  | {
      type: "CLOSE_CREATE_SCRIPT_DIALOG";
    }
  | {
      type: "OPEN_DELETE_SCRIPT_ALERT_DIALOG";
      payload: { scriptId: string };
    }
  | {
      type: "CLOSE_DELETE_SCRIPT_ALERT_DIALOG";
    }
  | {
      type: "NEW_SCRIPT";
      payload: { script: Script };
    }
  | {
      type: "UPDATE_SCRIPT";
      payload: { script: Script };
    }
  | {
      type: "DELETE_SCRIPT";
      payload: { scriptId: string };
    }
  | {
      type: "OPEN_CREATE_COMPONENT_DIALOG";
    }
  | {
      type: "CLOSE_CREATE_COMPONENT_DIALOG";
    }
  | {
      type: "OPEN_UPSERT_STORAGE_SLOT_DIALOG";
      payload: { componentId: string; storageSlotIndex: number };
    }
  | {
      type: "CLOSE_UPSERT_STORAGE_SLOT_DIALOG";
    }
  | {
      type: "NEW_COMPONENT";
      payload: { component: Component };
    }
  | {
      type: "UPDATE_COMPONENT";
      payload: { component: Component };
    }
  | {
      type: "START_TUTORIAL";
      payload: { tutorialId: string };
    }
  | {
      type: "LOAD_TUTORIAL";
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
    case "OPEN_DEPLOY_ACCOUNT_DIALOG": {
      return {
        ...state,
        deployAccountDialogOpen: true,
      };
    }
    case "CLOSE_DEPLOY_ACCOUNT_DIALOG": {
      return {
        ...state,
        deployAccountDialogOpen: false,
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
        serializedMockChain: action.payload.serializedMockChain,
      };
    }
    case "OPEN_CREATE_SCRIPT_DIALOG": {
      return {
        ...state,
        createScriptDialogOpen: true,
      };
    }
    case "CLOSE_CREATE_SCRIPT_DIALOG": {
      return {
        ...state,
        createScriptDialogOpen: false,
      };
    }
    case "OPEN_DELETE_SCRIPT_ALERT_DIALOG": {
      return {
        ...state,
        deleteScriptAlertDialogOpen: true,
        deleteScriptAlertDialogScriptId: action.payload.scriptId,
      };
    }
    case "CLOSE_DELETE_SCRIPT_ALERT_DIALOG": {
      return {
        ...state,
        deleteScriptAlertDialogOpen: false,
      };
    }
    case "NEW_SCRIPT": {
      return {
        ...state,
        scripts: [...state.scripts, action.payload.script],
      };
    }
    case "UPDATE_SCRIPT": {
      const index = state.scripts.findIndex(
        ({ id }) => id === action.payload.script.id
      );
      return {
        ...state,
        scripts: [
          ...state.scripts.slice(0, index),
          { ...action.payload.script, updatedAt: Date.now() },
          ...state.scripts.slice(index + 1),
        ],
      };
    }
    case "DELETE_SCRIPT": {
      const index = state.scripts.findIndex(
        ({ id }) => id === action.payload.scriptId
      );
      return {
        ...state,
        scripts: [
          ...state.scripts.slice(0, index),
          ...state.scripts.slice(index + 1),
        ],
      };
    }
    case "OPEN_CREATE_COMPONENT_DIALOG": {
      return {
        ...state,
        createComponentDialogOpen: true,
      };
    }
    case "CLOSE_CREATE_COMPONENT_DIALOG": {
      return {
        ...state,
        createComponentDialogOpen: false,
      };
    }
    case "OPEN_UPSERT_STORAGE_SLOT_DIALOG": {
      return {
        ...state,
        upsertStorageSlotDialogOpen: true,
        upsertStorageSlotDialogComponentId: action.payload.componentId,
        upsertStorageSlotDialogStorageSlotIndex:
          action.payload.storageSlotIndex,
      };
    }
    case "CLOSE_UPSERT_STORAGE_SLOT_DIALOG": {
      return {
        ...state,
        upsertStorageSlotDialogOpen: false,
      };
    }
    case "NEW_COMPONENT": {
      return {
        ...state,
        components: [...state.components, action.payload.component],
      };
    }
    case "UPDATE_COMPONENT": {
      const index = state.components.findIndex(
        ({ id }) => id === action.payload.component.id
      );
      return {
        ...state,
        components: [
          ...state.components.slice(0, index),
          { ...action.payload.component, updatedAt: Date.now() },
          ...state.components.slice(index + 1),
        ],
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
    case "LOAD_TUTORIAL": {
      return {
        ...state,
        tutorialLoaded: true,
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
