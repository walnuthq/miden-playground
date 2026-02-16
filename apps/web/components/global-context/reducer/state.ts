import { type Account } from "@/lib/types/account";
import { type NetworkId } from "@/lib/types/network";
import { type InputNote } from "@/lib/types/note";
import { type State } from "@/lib/types/state";

export type StateAction =
  | {
      type: "SWITCH_NETWORK";
      payload: { networkId: NetworkId; blockNum: number };
    }
  | {
      type: "MOCK_WEB_CLIENT_INITIALIZING";
    }
  | {
      type: "MOCK_WEB_CLIENT_INITIALIZED";
      payload: { blockNum: number; serializedMockChain: Uint8Array };
    }
  | {
      type: "WEB_CLIENT_INITIALIZING";
    }
  | {
      type: "WEB_CLIENT_INITIALIZED";
      payload: { blockNum: number };
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
  | {
      type: "PUSH_STATE";
      payload: { nextState: State };
    }
  | { type: "POP_STATE" };

const reducer = (state: State, action: StateAction): State => {
  switch (action.type) {
    case "SWITCH_NETWORK": {
      return {
        ...state,
        networkId: action.payload.networkId,
        blockNum: action.payload.blockNum,
      };
    }
    case "MOCK_WEB_CLIENT_INITIALIZING": {
      return {
        ...state,
        initializingMockWebClient: true,
      };
    }
    case "MOCK_WEB_CLIENT_INITIALIZED": {
      return {
        ...state,
        blockNum: action.payload.blockNum,
        serializedMockChain: action.payload.serializedMockChain,
        nextStore: null,
        initializingMockWebClient: false,
      };
    }
    case "WEB_CLIENT_INITIALIZING": {
      return {
        ...state,
        initializingWebClient: true,
      };
    }
    case "WEB_CLIENT_INITIALIZED": {
      return {
        ...state,
        blockNum: action.payload.blockNum,
        serializedMockChain: new Uint8Array(),
        nextStore: null,
        initializingWebClient: false,
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
