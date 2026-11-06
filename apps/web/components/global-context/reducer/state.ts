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
        inputNotes: InputNote[];
        transactions: Transaction[];
      };
    }
  | {
      type: "PUSH_STATE";
      payload: { nextState: State };
    }
  // Switches to the queued next state, or to `state` instead (its fallback).
  | { type: "POP_STATE"; payload?: { state: State } }
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
      // when the sync started: keep the ones added while it was running.
      const { accounts, inputNotes, transactions } = action.payload;
      return {
        ...state,
        accounts: [
          ...accounts,
          ...state.accounts.filter(
            ({ id }) => !accounts.some((account) => account.id === id),
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
      const nextState = action.payload?.state ?? state.nextState;
      if (!nextState) {
        return state;
      }
      return {
        ...nextState,
        nextState: null,
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
