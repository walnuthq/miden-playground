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

const usePersistedReducer = () => {
  const [state, setState] = useLocalStorage(STATE_STORAGE_KEY, defaultState(), {
    serializer: stateSerializer,
    deserializer: stateDeserializer,
  });
  const persistedReducer = useCallback(
    (prevState: State, action: Action) => {
      const nextState = reducer(prevState, action);
      setState(nextState);
      return nextState;
    },
    [setState],
  );
  return useReducer(persistedReducer, state);
};

const GlobalContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = usePersistedReducer();
  return <GlobalContext value={{ state, dispatch }}>{children}</GlobalContext>;
};

export default GlobalContextProvider;
