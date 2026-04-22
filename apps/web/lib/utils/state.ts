import type { Account } from "@/lib/types/account";
import type { InputNote } from "@/lib/types/note";
import type { Component } from "@/lib/types/component";
import type { Transaction } from "@/lib/types/transaction";
import type { State } from "@/lib/types/state";
import type { Script } from "@/lib/types/script";
import type { TutorialId } from "@/lib/types/tutorial";
import defaultScripts from "@/lib/types/default-scripts";
import defaultComponents from "@/lib/types/default-components";

export const defaultState = (): State => ({
  // GLOBAL
  serializedMockChain: new Uint8Array(),
  syncingState: false,
  nextState: null,
  nextStore: null,
  // ACCOUNTS
  createWalletDialogOpen: false,
  createFaucetDialogOpen: false,
  importAccountDialogOpen: false,
  importAccountDialogMultisig: false,
  deployAccountDialogOpen: false,
  verifyAccountComponentDialogOpen: false,
  verifyAccountComponentDialogAccountId: "",
  deployMultisigDialogOpen: false,
  accounts: [],
  // TRANSACTIONS
  submittingTransaction: false,
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
  invokeProcedureArgumentsDialogScript: null,
  invokeProcedureArgumentsDialogProcedure: null,
  addDependencyDialogOpen: false,
  addDependencyDialogScriptId: "",
  importProjectDialogOpen: false,
  readOnlyProcedureDigest: "",
  readOnlyProcedureResult: "",
  scripts: defaultScripts,
  // COMPONENTS
  createComponentDialogOpen: false,
  upsertStorageSlotDialogOpen: false,
  upsertStorageSlotDialogComponentId: "",
  upsertStorageSlotDialogStorageSlotName: "",
  components: defaultComponents,
  // TUTORIALS
  tutorialId: "",
  tutorialStep: 0,
  tutorialMaxStep: 0,
  tutorialOpen: true,
  nextTutorialStepDisabled: true,
  completedTutorials: new Set([]),
  // EXAMPLES
  exampleId: "",
});

export const stateSerializer = ({
  serializedMockChain,
  accounts,
  transactions,
  inputNotes,
  scripts,
  components,
  tutorialId,
  tutorialStep,
  tutorialMaxStep,
  tutorialOpen,
  nextTutorialStepDisabled,
  completedTutorials,
}: State) =>
  JSON.stringify({
    serializedMockChain:
      serializedMockChain === null ? null : serializedMockChain.toString(),
    accounts,
    transactions,
    inputNotes,
    scripts,
    components,
    tutorialId,
    tutorialStep,
    tutorialMaxStep,
    tutorialOpen,
    nextTutorialStepDisabled,
    completedTutorials: [...completedTutorials],
  });

export const stateDeserializer = (value: string): State => {
  try {
    const {
      serializedMockChain,
      accounts,
      transactions,
      inputNotes,
      scripts,
      components,
      tutorialId,
      tutorialStep,
      tutorialMaxStep,
      tutorialOpen,
      nextTutorialStepDisabled,
      completedTutorials,
    } = JSON.parse(value) as {
      blockNum?: number;
      serializedMockChain?: string;
      accounts?: Account[];
      transactions?: Transaction[];
      inputNotes?: InputNote[];
      scripts?: Script[];
      components?: Component[];
      tutorialId?: TutorialId;
      tutorialStep?: number;
      tutorialMaxStep?: number;
      tutorialOpen?: boolean;
      nextTutorialStepDisabled?: boolean;
      completedTutorials?: string[];
    };
    const initialState = defaultState();
    return {
      ...initialState,
      serializedMockChain: serializedMockChain
        ? new Uint8Array(serializedMockChain.split(",").map(Number))
        : initialState.serializedMockChain,
      accounts: accounts ?? initialState.accounts,
      transactions: transactions ?? initialState.transactions,
      inputNotes: inputNotes ?? initialState.inputNotes,
      scripts: scripts ?? initialState.scripts,
      components: components ?? initialState.components,
      tutorialId: tutorialId ?? initialState.tutorialId,
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
    console.error("ERROR: stateDeserializer", error);
    return defaultState();
  }
};
