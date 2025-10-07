import { type Account } from "@/lib/types/account";
import { type NetworkId } from "@/lib/types/network";
import { type InputNote } from "@/lib/types/note";
import { type State, defaultState } from "@/lib/types/state";

export type GlobalAction =
  | { type: "RESET_STATE"; payload: { networkId: NetworkId; blockNum: number } }
  | {
      type: "SWITCH_NETWORK";
      payload: { networkId: NetworkId; blockNum: number };
    }
  | {
      type: "SYNC_STATE";
      payload: {
        blockNum: number;
        accounts: Account[];
        inputNotes: InputNote[];
      };
    }
  | { type: "LOAD_PROJECT"; payload: { state: State } };

const reducer = (state: State, action: GlobalAction): State => {
  switch (action.type) {
    case "RESET_STATE": {
      return {
        ...defaultState(),
        networkId: action.payload.networkId,
        blockNum: action.payload.blockNum,
      };
    }
    case "SWITCH_NETWORK": {
      return {
        ...state,
        networkId: action.payload.networkId,
        blockNum: action.payload.blockNum,
      };
    }
    case "SYNC_STATE": {
      return {
        ...state,
        blockNum: action.payload.blockNum,
        accounts: action.payload.accounts,
        inputNotes: action.payload.inputNotes,
      };
    }
    case "LOAD_PROJECT": {
      return action.payload.state;
    }
  }
};

export default reducer;
