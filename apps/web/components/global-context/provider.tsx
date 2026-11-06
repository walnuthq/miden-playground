import { type ReactNode, useCallback, useReducer } from "react";
import { useLocalStorage } from "usehooks-ts";
import GlobalContext from "@/components/global-context";
import reducer, { type Action } from "@/components/global-context/reducer";
import type { State } from "@/lib/types/state";
import {
  defaultState,
  STATE_STORAGE_KEY,
  stateDeserializer,
  stateSerializer,
} from "@/lib/utils/state";

// An action bound to the workspace run it was dispatched from.
type RunAction = Action & { workspaceRun?: number };

const usePersistedReducer = () => {
  const [state, setState] = useLocalStorage(STATE_STORAGE_KEY, defaultState(), {
    serializer: stateSerializer,
    deserializer: stateDeserializer,
  });
  const persistedReducer = useCallback(
    (prevState: State, action: RunAction) => {
      if (
        action.workspaceRun !== undefined &&
        action.workspaceRun !== prevState.workspaceRun
      ) {
        return prevState;
      }
      const nextState = reducer(prevState, action);
      setState(nextState);
      return nextState;
    },
    [setState],
  );
  return useReducer(persistedReducer, state);
};

const GlobalContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, globalDispatch] = usePersistedReducer();
  // Bound to the workspace of the render that handed it out. An operation still
  // running when the workspace is replaced (a sync, a deploy, a transaction)
  // holds this dispatch in its closure, and can't write its results into the
  // next workspace: the reducer drops them.
  const { workspaceRun } = state;
  const dispatch = useCallback(
    (action: Action) => globalDispatch({ ...action, workspaceRun }),
    [globalDispatch, workspaceRun],
  );
  return (
    <GlobalContext value={{ state, dispatch, globalDispatch }}>
      {children}
    </GlobalContext>
  );
};

export default GlobalContextProvider;
