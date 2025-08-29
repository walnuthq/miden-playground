"use client";
import { type ReactNode, useCallback, useReducer } from "react";
import { useLocalStorage } from "usehooks-ts";
import GlobalContext from "@/components/global-context";
import {
  initialState,
  stateDeserializer,
  stateSerializer,
  reducer,
  type State,
  type Action,
} from "@/components/global-context/reducer";

const usePersistedReducer = () => {
  const [state, setState] = useLocalStorage("state", initialState(), {
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
