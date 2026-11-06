import type {
  ConsumableNoteRecord as WasmConsumableNoteRecordType,
  TransactionRequest as WasmTransactionRequestType,
  TransactionResult as WasmTransactionResultType,
} from "@miden-sdk/miden-sdk";
import type { Account } from "@/lib/types/account";
import type { Component } from "@/lib/types/component";
import type { InputNote } from "@/lib/types/note";
import type { TutorialProgress } from "@/lib/types/project";
import type { ProcedureExport, Script } from "@/lib/types/script";
import type { Store } from "@/lib/types/store";
import type {
  CreateTransactionDialogStep,
  Transaction,
  TransactionType,
} from "@/lib/types/transaction";
import type { TutorialId } from "@/lib/types/tutorial";

export type State = {
  // GLOBAL
  serializedMockChain: Uint8Array;
  syncingState: boolean;
  nextState: State | null;
  // The store to import with `nextState`: a `Store`, or a store dump as
  // `exportStore()` returns it (a saved project).
  nextStore: Store | string | null;
  // What to switch to instead when `nextStore` can't be imported (a saved
  // project the running client refuses), with its own `nextStore`.
  fallbackState: State | null;
  // Counts the switches to another workspace (POP_STATE) since the page loaded.
  // Work started before a switch can't write to the workspace that follows
  // (see GlobalContextProvider). Not persisted.
  workspaceRun: number;
  // ACCOUNTS
  createWalletDialogOpen: boolean;
  createFaucetDialogOpen: boolean;
  importAccountDialogOpen: boolean;
  importAccountDialogMultisig: boolean;
  deployAccountDialogOpen: boolean;
  verifyAccountComponentDialogOpen: boolean;
  verifyAccountComponentDialogAccountId: string;
  deployMultisigDialogOpen: boolean;
  accounts: Account[];
  // TRANSACTIONS
  submittingTransaction: boolean;
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
  invokeProcedureArgumentsDialogScript: Script | null;
  invokeProcedureArgumentsDialogProcedure: ProcedureExport | null;
  addDependencyDialogOpen: boolean;
  addDependencyDialogScriptId: string;
  importProjectDialogOpen: boolean;
  readOnlyProcedureDigest: string;
  readOnlyProcedureResult: string;
  scripts: Script[];
  // COMPONENTS
  createComponentDialogOpen: boolean;
  upsertStorageSlotDialogOpen: boolean;
  upsertStorageSlotDialogComponentId: string;
  upsertStorageSlotDialogStorageSlotName: string;
  components: Component[];
  // TUTORIALS
  tutorialId: TutorialId;
  tutorialStep: number;
  tutorialMaxStep: number;
  // The chain tip when the tutorial started, to tell notes created during the
  // tutorial from older ones the reset store fetches again.
  tutorialStartBlockNum: number;
  // A random lowercase id drawn when the tutorial starts, for tutorials whose
  // resources must not collide with other runs (lowercase letters only, so it
  // survives snake_case conversion unchanged).
  tutorialRunId: string;
  tutorialOpen: boolean;
  nextTutorialStepDisabled: boolean;
  completedTutorials: Set<string>;
  // The tutorials left unfinished, saved as projects to resume them. The
  // active tutorial has no entry: its progress is the state itself.
  tutorialProgress: Partial<Record<TutorialId, TutorialProgress>>;
  // EXAMPLES
  exampleId: string;
  // PROJECTS
  // The saved project the workspace is (see `lib/utils/project.ts`): Save
  // writes to it, and the sidebar shows its name. Empty for a sandbox or an
  // example that was never saved, and in every state that starts one.
  projectId: string;
  projectName: string;
  // Opened from the project switcher's menu, rendered outside it (on a phone
  // the switcher is in the sidebar sheet, which unmounts it when it closes).
  saveProjectDialogOpen: boolean;
  saveProjectDialogSaveAs: boolean;
  deleteProjectDialogOpen: boolean;
};
