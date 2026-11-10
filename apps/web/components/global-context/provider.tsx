import {
  type ReactNode,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";
import GlobalContext from "@/components/global-context";
import reducer, { type Action } from "@/components/global-context/reducer";
import type { State } from "@/lib/types/state";
import {
  defaultState,
  PERSISTED_KEYS,
  STATE_STORAGE_KEY,
  stateDeserializer,
  stateSerializer,
} from "@/lib/utils/state";
import { setLiveWorkspace } from "@/lib/utils/workspace-guard";

// An action bound to the workspace run it was dispatched from.
type RunAction = Action & { workspaceRun?: number };

// The state as it was last persisted, or the default one.
const readPersistedState = (): State => {
  try {
    const value = localStorage.getItem(STATE_STORAGE_KEY);
    return value === null ? defaultState() : stateDeserializer(value);
  } catch {
    // Storage can throw when it's blocked.
    return defaultState();
  }
};

const persistedReducer = (prevState: State, action: RunAction) =>
  action.workspaceRun !== undefined &&
  action.workspaceRun !== prevState.workspaceRun
    ? prevState
    : reducer(prevState, action);

const usePersistedReducer = () => {
  const [state, dispatch] = useReducer(
    persistedReducer,
    undefined,
    readPersistedState,
  );
  // Written after the render that changed it, and only when a persisted
  // field did: the reducer stays pure, and a dialog opening costs no write.
  const persisted = useRef(state);
  useEffect(() => {
    const previous = persisted.current;
    if (
      previous !== state &&
      PERSISTED_KEYS.some((key) => previous[key] !== state[key])
    ) {
      try {
        localStorage.setItem(STATE_STORAGE_KEY, stateSerializer(state));
      } catch (error) {
        console.warn("Error persisting the state:", error);
      }
    }
    persisted.current = state;
  }, [state]);
  return [state, dispatch] as const;
};

const GlobalContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, globalDispatch] = usePersistedReducer();
  // Bound to the workspace of the render that handed it out. An operation still
  // running when the workspace is replaced (a sync, a deploy, a transaction)
  // holds this dispatch in its closure, and can't write its results into the
  // next workspace: the reducer drops them.
  const { workspaceRun } = state;
  setLiveWorkspace(workspaceRun, state.nextState !== null);
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
