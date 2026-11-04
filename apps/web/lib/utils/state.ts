import type { Account } from "@/lib/types/account";
import type { Component } from "@/lib/types/component";
import defaultComponents from "@/lib/types/default-components";
import defaultScripts from "@/lib/types/default-scripts";
import type { InputNote } from "@/lib/types/note";
import type { Script } from "@/lib/types/script";
import type { State } from "@/lib/types/state";
import type { Transaction } from "@/lib/types/transaction";
import type { TutorialId } from "@/lib/types/tutorial";
import { randomLowercaseId } from "@/lib/utils";
import { sourceFiles } from "@/lib/utils/script-files";

// The local storage key holding the serialized app state. Exported so the
// Miden provider can drop it when the client store it describes is deleted.
export const STATE_STORAGE_KEY = "state";

export const defaultState = (): State => ({
  // GLOBAL
  serializedMockChain: new Uint8Array(),
  syncingState: false,
  nextState: null,
  nextStore: null,
  fallbackState: null,
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
  tutorialStartBlockNum: 0,
  tutorialRunId: "",
  tutorialOpen: true,
  nextTutorialStepDisabled: true,
  completedTutorials: new Set([]),
  tutorialProgress: {},
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
  tutorialStartBlockNum,
  tutorialRunId,
  tutorialOpen,
  nextTutorialStepDisabled,
  completedTutorials,
  tutorialProgress,
  exampleId,
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
    tutorialStartBlockNum,
    tutorialRunId,
    tutorialOpen,
    nextTutorialStepDisabled,
    completedTutorials: [...completedTutorials],
    tutorialProgress,
    exampleId,
  });

// Scripts persisted before the package `digest` was renamed `commitment` still
// carry the old field, on themselves and on their dependencies. Those
// persisted before `files` have their source in `rust` (saved projects and
// tutorial snapshots too, which load through here).
type LegacyScript = Omit<Script, "dependencies" | "files"> & {
  digest?: string;
  rust?: string;
  files?: Script["files"];
  dependencies: (Script["dependencies"][number] & { digest?: string })[];
};

const migrateScript = ({
  digest,
  rust,
  files,
  ...script
}: LegacyScript): Script => ({
  ...script,
  files: files ?? sourceFiles(rust ?? ""),
  commitment: script.commitment ?? digest ?? "",
  dependencies: script.dependencies.map(({ digest, ...dependency }) => ({
    ...dependency,
    commitment: dependency.commitment ?? digest ?? "",
  })),
});

// A state persisted (or saved in a project) before a built-in script was added
// lacks it: add the missing ones, which recognize standard notes (e.g.
// fee-sponsorship) by their script root.
const withDefaultScripts = (scripts: Script[]) => [
  ...scripts,
  ...defaultScripts.filter(
    ({ id }) => !scripts.some((script) => script.id === id),
  ),
];

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
      tutorialStartBlockNum,
      tutorialRunId,
      tutorialOpen,
      nextTutorialStepDisabled,
      completedTutorials,
      tutorialProgress,
      exampleId,
    } = JSON.parse(value) as {
      blockNum?: number;
      serializedMockChain?: string;
      accounts?: Account[];
      transactions?: Transaction[];
      inputNotes?: InputNote[];
      scripts?: LegacyScript[];
      components?: Component[];
      tutorialId?: TutorialId;
      tutorialStep?: number;
      tutorialMaxStep?: number;
      tutorialStartBlockNum?: number;
      tutorialRunId?: string;
      tutorialOpen?: boolean;
      nextTutorialStepDisabled?: boolean;
      completedTutorials?: string[];
      tutorialProgress?: State["tutorialProgress"];
      exampleId?: string;
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
      scripts: scripts
        ? withDefaultScripts(scripts.map(migrateScript))
        : initialState.scripts,
      components: components ?? initialState.components,
      tutorialId: tutorialId ?? initialState.tutorialId,
      tutorialStep: tutorialStep ?? initialState.tutorialStep,
      tutorialMaxStep: tutorialMaxStep ?? initialState.tutorialMaxStep,
      tutorialStartBlockNum:
        tutorialStartBlockNum ?? initialState.tutorialStartBlockNum,
      // States persisted before the run id existed get one now.
      tutorialRunId: tutorialRunId || randomLowercaseId(),
      tutorialOpen: tutorialOpen ?? initialState.tutorialOpen,
      nextTutorialStepDisabled:
        nextTutorialStepDisabled ?? initialState.nextTutorialStepDisabled,
      completedTutorials: completedTutorials
        ? new Set(completedTutorials)
        : initialState.completedTutorials,
      tutorialProgress: tutorialProgress ?? initialState.tutorialProgress,
      exampleId: exampleId ?? initialState.exampleId,
    };
  } catch (error) {
    console.error("ERROR: stateDeserializer", error);
    return defaultState();
  }
};
