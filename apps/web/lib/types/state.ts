import type {
  ConsumableNoteRecord as WasmConsumableNoteRecordType,
  TransactionRequest as WasmTransactionRequestType,
  TransactionResult as WasmTransactionResultType,
} from "@miden-sdk/miden-sdk";
import type { Account } from "@/lib/types/account";
import type { Component } from "@/lib/types/component";
import type { InputNote } from "@/lib/types/note";
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
  nextStore: Store | null;
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
  // EXAMPLES
  exampleId: string;
};
