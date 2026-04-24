import type { Account } from "@/lib/types/account";
import type { InputNote } from "@/lib/types/note";
import type { State } from "@/lib/types/state";

export type StateAction =
  | { type: "SYNCING_STATE"; payload: { syncingState: boolean } }
  | {
      type: "SYNC_STATE";
      payload: {
        accounts: Account[];
        inputNotes: InputNote[];
      };
    }
  | {
      type: "PUSH_STATE";
      payload: { nextState: State };
    }
  | { type: "POP_STATE" };

const reducer = (state: State, action: StateAction): State => {
  switch (action.type) {
    case "SYNCING_STATE": {
      return {
        ...state,
        syncingState: action.payload.syncingState,
      };
    }
    case "SYNC_STATE": {
      return {
        ...state,
        accounts: action.payload.accounts,
        inputNotes: action.payload.inputNotes,
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
      if (!state.nextState) {
        return state;
      }
      return {
        ...state.nextState,
        nextState: null,
      };
    }
  }
};

export default reducer;
