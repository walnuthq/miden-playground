import {
  type ConsumableNoteRecord as WasmConsumableNoteRecordType,
  type TransactionRequest as WasmTransactionRequestType,
  type TransactionResult as WasmTransactionResultType,
} from "@demox-labs/miden-sdk";
import { type Account } from "@/lib/types/account";
import { type NetworkId } from "@/lib/types/network";
import { type InputNote } from "@/lib/types/note";
import { type Component } from "@/lib/types/component";
import {
  type Transaction,
  type TransactionType,
  type CreateTransactionDialogStep,
} from "@/lib/types/transaction";
import { type Script, type Procedure } from "@/lib/types/script";
import defaultScripts from "@/lib/types/default-scripts";
import defaultComponents from "@/lib/types/default-components";

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
  verifyAccountComponentDialogOpen: boolean;
  verifyAccountComponentDialogAccountId: string;
  accounts: Account[];
  // TRANSACTIONS
  createTransactionDialogOpen: boolean;
  createTransactionDialogAccountId: string;
  createTransactionDialogTransactionType: TransactionType;
  createTransactionDialogConsumableNotes: WasmConsumableNoteRecordType[];
  createTransactionDialogNoteIds: string[];
  createTransactionDialogStep: CreateTransactionDialogStep;
  createTransactionDialogTransactionRequest: WasmTransactionRequestType | null;
  createTransactionDialogTransactionResult: WasmTransactionResultType | null;
  transactions: Transaction[];
  // NOTES
  inputNotes: InputNote[];
  exportNoteDialogOpen: boolean;
  importNoteDialogOpen: boolean;
  createNoteDialogOpen: boolean;
  verifyNoteScriptDialogOpen: boolean;
  verifyNoteScriptDialogNoteId: string;
  // SCRIPTS
  createScriptDialogOpen: boolean;
  deleteScriptAlertDialogOpen: boolean;
  deleteScriptAlertDialogScriptId: string;
  invokeProcedureArgumentsDialogOpen: boolean;
  invokeProcedureArgumentsDialogSenderAccountId: string;
  invokeProcedureArgumentsDialogScriptId: string;
  invokeProcedureArgumentsDialogProcedure: Procedure | null;
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
  completedTutorials: Set<number>;
};

export const defaultState = (): State => ({
  // GLOBAL
  networkId: "mtst",
  blockNum: 0,
  serializedMockChain: null,
  // ACCOUNTS
  createWalletDialogOpen: false,
  createFaucetDialogOpen: false,
  importAccountDialogOpen: false,
  deployAccountDialogOpen: false,
  verifyAccountComponentDialogOpen: false,
  verifyAccountComponentDialogAccountId: "",
  accounts: [],
  // TRANSACTIONS
  createTransactionDialogOpen: false,
  createTransactionDialogAccountId: "",
  createTransactionDialogTransactionType: "consume",
  createTransactionDialogStep: "select",
  createTransactionDialogConsumableNotes: [],
  createTransactionDialogNoteIds: [],
  createTransactionDialogTransactionRequest: null,
  createTransactionDialogTransactionResult: null,
  transactions: [],
  // NOTES
  inputNotes: [],
  exportNoteDialogOpen: false,
  importNoteDialogOpen: false,
  createNoteDialogOpen: false,
  verifyNoteScriptDialogOpen: false,
  verifyNoteScriptDialogNoteId: "",
  // SCRIPTS
  createScriptDialogOpen: false,
  deleteScriptAlertDialogOpen: false,
  deleteScriptAlertDialogScriptId: "",
  invokeProcedureArgumentsDialogOpen: false,
  invokeProcedureArgumentsDialogSenderAccountId: "",
  invokeProcedureArgumentsDialogScriptId: "",
  invokeProcedureArgumentsDialogProcedure: null,
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
  completedTutorials: new Set([]),
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
  completedTutorials,
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
    inputNotes,
    scripts,
    components,
    tutorialId,
    tutorialLoaded,
    tutorialStep,
    tutorialMaxStep,
    tutorialOpen,
    nextTutorialStepDisabled,
    completedTutorials: [...completedTutorials],
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
      completedTutorials,
    } = JSON.parse(value) as {
      networkId?: NetworkId;
      blockNum?: number;
      serializedMockChain?: string | null;
      accounts?: (Omit<Account, "nonce"> & { nonce: string })[];
      transactions?: Transaction[];
      inputNotes?: InputNote[];
      scripts?: (Omit<Script, "procedures"> & {
        procedures: (Omit<Procedure, "storageRead"> & {
          storageRead?:
            | {
                type: "value";
                index: number;
              }
            | {
                type: "map";
                index: number;
                key: string[];
              };
        })[];
      })[];
      components?: Component[];
      tutorialId?: string;
      tutorialLoaded?: boolean;
      tutorialStep?: number;
      tutorialMaxStep?: number;
      tutorialOpen?: boolean;
      nextTutorialStepDisabled?: boolean;
      completedTutorials: number[];
    };
    const initialState = defaultState();
    return {
      ...initialState,
      networkId: networkId ?? initialState.networkId,
      blockNum: blockNum ?? initialState.blockNum,
      serializedMockChain:
        serializedMockChain === null || serializedMockChain === undefined
          ? null
          : new Uint8Array(serializedMockChain.split(",").map(Number)),
      accounts: accounts
        ? accounts.map((account) => ({
            ...account,
            nonce: BigInt(account.nonce),
          }))
        : initialState.accounts,
      transactions: transactions ?? initialState.transactions,
      inputNotes: inputNotes ?? initialState.inputNotes,
      scripts: scripts ?? initialState.scripts,
      components: components ?? initialState.components,
      tutorialId: tutorialId ?? initialState.tutorialId,
      tutorialLoaded: tutorialLoaded ?? initialState.tutorialLoaded,
      tutorialStep: tutorialStep ?? initialState.tutorialStep,
      tutorialMaxStep: tutorialMaxStep ?? initialState.tutorialMaxStep,
      tutorialOpen: tutorialOpen ?? initialState.tutorialOpen,
      nextTutorialStepDisabled:
        nextTutorialStepDisabled ?? initialState.nextTutorialStepDisabled,
      completedTutorials: completedTutorials
        ? new Set(completedTutorials)
        : initialState.completedTutorials,
    };
  } catch (error) {
    console.error(error);
    return defaultState();
  }
};
