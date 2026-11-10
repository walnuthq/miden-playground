import type { Account } from "@/lib/types/account";
import type { Component } from "@/lib/types/component";
import defaultComponents from "@/lib/types/default-components";
import defaultScripts from "@/lib/types/default-scripts";
import type { InputNote } from "@/lib/types/note";
import type { Script, ScriptType } from "@/lib/types/script";
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
  workspaceRun: 0,
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
  readOnlyProcedureAccountId: "",
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
  // PROJECTS
  projectId: "",
  projectName: "",
  saveProjectDialogOpen: false,
  saveProjectDialogSaveAs: false,
  deleteProjectDialogOpen: false,
});

// The fields stateSerializer writes: keep the two in step. A change to any
// other field (a dialog flag, syncingState) isn't worth a write.
export const PERSISTED_KEYS = [
  "serializedMockChain",
  "accounts",
  "transactions",
  "inputNotes",
  "scripts",
  "components",
  "tutorialId",
  "tutorialStep",
  "tutorialMaxStep",
  "tutorialStartBlockNum",
  "tutorialRunId",
  "tutorialOpen",
  "nextTutorialStepDisabled",
  "completedTutorials",
  "tutorialProgress",
  "exampleId",
  "projectId",
  "projectName",
] as const satisfies readonly (keyof State)[];

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
  projectId,
  projectName,
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
    projectId,
    projectName,
  });

// Scripts persisted before the package `digest` was renamed `commitment` still
// carry the old field, on themselves and on their dependencies. Those
// persisted before `files` have their source in `rust` (saved projects and
// tutorial snapshots too, which load through here).
// Transaction scripts persisted before the playground used Miden's canonical
// kind name are typed "tx-script", themselves and as dependencies.
type LegacyScriptType = ScriptType | "tx-script";

const migrateScriptType = (type: LegacyScriptType): ScriptType =>
  type === "tx-script" ? "transaction-script" : type;

type LegacyScript = Omit<Script, "type" | "dependencies" | "files"> & {
  type: LegacyScriptType;
  digest?: string;
  rust?: string;
  files?: Script["files"];
  dependencies: (Omit<Script["dependencies"][number], "type"> & {
    type: LegacyScriptType;
    digest?: string;
  })[];
};

const migrateScript = ({
  digest,
  rust,
  files,
  ...script
}: LegacyScript): Script => ({
  ...script,
  type: migrateScriptType(script.type),
  files: files ?? sourceFiles(rust ?? ""),
  commitment: script.commitment ?? digest ?? "",
  dependencies: script.dependencies.map(({ digest, ...dependency }) => ({
    ...dependency,
    type: migrateScriptType(dependency.type),
    commitment: dependency.commitment ?? digest ?? "",
  })),
});

// The built-in scripts as the code defines them. A state persisted (or saved in
// a project) holds a copy of each, which can predate a change to it (e.g. its
// procedures' `readOnly` flags): built-ins can't be edited, so the code's
// version replaces it. One added since is missing: add it, as built-ins
// recognize standard notes (e.g. fee-sponsorship) by their script root. One
// removed since stays as it was persisted, and needs its id in
// retiredScriptIds (lib/types/default-scripts) to stay out of the user's.
const withDefaultScripts = (scripts: Script[]) => [
  ...scripts.map(
    (script) => defaultScripts.find(({ id }) => id === script.id) ?? script,
  ),
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
      projectId,
      projectName,
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
      projectId?: string;
      projectName?: string;
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
      projectId: projectId ?? initialState.projectId,
      projectName: projectName ?? initialState.projectName,
    };
  } catch (error) {
    console.error("ERROR: stateDeserializer", error);
    return defaultState();
  }
};
