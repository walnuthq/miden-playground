import { type Account } from "@/lib/types/account";
import { type NetworkId } from "@/lib/types/network";
import { type InputNote } from "@/lib/types/note";
import { type State } from "@/lib/types/state";
import { type Store } from "@/lib/types/store";

export type GlobalAction =
  | {
      type: "SWITCH_NETWORK";
      payload: { networkId: NetworkId; blockNum: number };
    }
  | { type: "SYNCING_STATE"; payload: { syncingState: boolean } }
  | {
      type: "SYNC_STATE";
      payload: {
        blockNum: number;
        accounts: Account[];
        inputNotes: InputNote[];
      };
    }
  | { type: "PUSH_STATE"; payload: { nextState: State; nextStore: Store } }
  | { type: "POP_STATE"; payload: { blockNum: number } };

const reducer = (state: State, action: GlobalAction): State => {
  switch (action.type) {
    case "SWITCH_NETWORK": {
      return {
        ...state,
        networkId: action.payload.networkId,
        blockNum: action.payload.blockNum,
      };
    }
    case "SYNCING_STATE": {
      return {
        ...state,
        syncingState: action.payload.syncingState,
      };
    }
    case "SYNC_STATE": {
      return {
        ...state,
        blockNum: action.payload.blockNum,
        accounts: action.payload.accounts,
        inputNotes: action.payload.inputNotes,
        syncingState: false,
      };
    }
    case "PUSH_STATE": {
      return {
        ...state,
        nextState: action.payload.nextState,
        nextStore: action.payload.nextStore,
      };
    }
    case "POP_STATE": {
      if (!state.nextState) {
        return state;
      }
      return {
        ...state.nextState,
        blockNum: action.payload.blockNum,
        nextState: null,
        nextStore: null,
      };
    }
  }
};

export default reducer;
