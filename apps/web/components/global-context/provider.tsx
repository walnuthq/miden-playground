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
import type { TutorialId } from "@/lib/types/tutorial";
import { deletedRustProjects } from "@/lib/utils/project";
import { persistedWorkspace, resettingWorkspace } from "@/lib/utils/rust-state";
import {
  defaultState,
  PERSISTED_KEYS,
  STATE_STORAGE_KEY,
  stateSerializer,
} from "@/lib/utils/state";
import { setLiveWorkspace } from "@/lib/utils/workspace-guard";

// An action bound to the workspace run it was dispatched from.
type RunAction = Action & { workspaceRun?: number };

// The state as it was last persisted, or the default one (a Rust one is
// reset, lib/utils/rust-state.ts).
const readPersistedState = (): State => {
  try {
    return persistedWorkspace(localStorage.getItem(STATE_STORAGE_KEY));
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
    // A workspace switch always writes the state it switched to, whose
    // fields can be the very ones already in memory (a reset workspace).
    // Nothing is written while a reset workspace waits for its sandbox.
    if (
      previous !== state &&
      !resettingWorkspace(state.workspaceRun) &&
      (previous.workspaceRun !== state.workspaceRun ||
        PERSISTED_KEYS.some((key) => previous[key] !== state[key]))
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
  // Saved projects and tutorials holding a Rust script are deleted once
  // (lib/utils/rust-state.ts): a deleted tutorial's progress goes too.
  useEffect(() => {
    deletedRustProjects().then((deleted) => {
      const tutorialIds = deleted
        .filter(({ kind }) => kind === "tutorial")
        .map(({ id }) => id as TutorialId);
      if (tutorialIds.length > 0) {
        globalDispatch({
          type: "FORGET_TUTORIAL_PROGRESS",
          payload: { tutorialIds },
        });
      }
    });
  }, [globalDispatch]);
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
