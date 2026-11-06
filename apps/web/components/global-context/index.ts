import { type ActionDispatch, createContext } from "react";
import type { Action } from "@/components/global-context/reducer";
import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";

export default createContext<{
  state: State;
  // Bound to the current workspace (see GlobalContextProvider).
  dispatch: ActionDispatch<[action: Action]>;
  // Unbound and stable, for what outlives a workspace.
  globalDispatch: ActionDispatch<[action: Action]>;
}>({
  state: defaultState(),
  dispatch: () => {},
  globalDispatch: () => {},
});
