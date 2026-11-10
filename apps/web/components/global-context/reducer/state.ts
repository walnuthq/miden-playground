import type { Account } from "@/lib/types/account";
import type { InputNote } from "@/lib/types/note";
import type { State } from "@/lib/types/state";
import type { Transaction } from "@/lib/types/transaction";

export type StateAction =
  | { type: "SYNCING_STATE"; payload: { syncingState: boolean } }
  | {
      type: "SYNC_STATE";
      payload: {
        accounts: Account[];
        previousAccounts: Account[];
        inputNotes: InputNote[];
        transactions: Transaction[];
      };
    }
  | {
      type: "PUSH_STATE";
      payload: { nextState: State };
    }
  // `imported` (the queued next state whose store was imported) is done:
  // switches to it, or to `state` instead (its fallback). A state queued since
  // stays queued, its store still to import.
  | { type: "POP_STATE"; payload: { imported: State; state?: State } }
  // The saved project the workspace now is (both empty: none).
  | {
      type: "SET_PROJECT";
      payload: { projectId: string; projectName: string };
    }
  | { type: "OPEN_SAVE_PROJECT_DIALOG"; payload: { saveAs: boolean } }
  | { type: "CLOSE_SAVE_PROJECT_DIALOG" }
  | { type: "OPEN_DELETE_PROJECT_DIALOG" }
  | { type: "CLOSE_DELETE_PROJECT_DIALOG" };

const reducer = (state: State, action: StateAction): State => {
  switch (action.type) {
    case "SYNCING_STATE": {
      return {
        ...state,
        syncingState: action.payload.syncingState,
      };
    }
    case "SYNC_STATE": {
      // The payload is built from the accounts and transactions as they were
      // when the sync started (previousAccounts). An account deleted or changed
      // since then stays as it is now, and the ones added meanwhile are kept.
      const { accounts, previousAccounts, inputNotes, transactions } =
        action.payload;
      const untouched = (id: string) => {
        const current = state.accounts.find((account) => account.id === id);
        return (
          current !== undefined &&
          current === previousAccounts.find((account) => account.id === id)
        );
      };
      const syncedAccounts = accounts.filter(({ id }) => untouched(id));
      return {
        ...state,
        accounts: [
          ...syncedAccounts,
          ...state.accounts.filter(
            ({ id }) => !syncedAccounts.some((account) => account.id === id),
          ),
        ],
        inputNotes,
        transactions: [
          ...transactions,
          ...state.transactions.filter(
            ({ id }) =>
              !transactions.some((transaction) => transaction.id === id),
          ),
        ],
        syncingState: false,
      };
    }
    case "PUSH_STATE": {
      return {
        ...state,
        nextState: action.payload.nextState,
      };
    }
    case "POP_STATE": {
      const { imported, state: fallbackState } = action.payload;
      return {
        ...(fallbackState ?? imported),
        nextState: state.nextState === imported ? null : state.nextState,
        nextStore: null,
        fallbackState: null,
        workspaceRun: state.workspaceRun + 1,
      };
    }
    case "SET_PROJECT": {
      return {
        ...state,
        projectId: action.payload.projectId,
        projectName: action.payload.projectName,
      };
    }
    case "OPEN_SAVE_PROJECT_DIALOG": {
      return {
        ...state,
        saveProjectDialogOpen: true,
        saveProjectDialogSaveAs: action.payload.saveAs,
      };
    }
    case "CLOSE_SAVE_PROJECT_DIALOG": {
      return {
        ...state,
        saveProjectDialogOpen: false,
      };
    }
    case "OPEN_DELETE_PROJECT_DIALOG": {
      return {
        ...state,
        deleteProjectDialogOpen: true,
      };
    }
    case "CLOSE_DELETE_PROJECT_DIALOG": {
      return {
        ...state,
        deleteProjectDialogOpen: false,
      };
    }
  }
};

export default reducer;
