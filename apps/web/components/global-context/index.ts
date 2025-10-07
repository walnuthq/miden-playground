"use client";
import { noop } from "lodash";
import { createContext, type ActionDispatch } from "react";
import { type State, defaultState } from "@/lib/types/state";
import { type Action } from "@/components/global-context/reducer";

export default createContext<{
  state: State;
  dispatch: ActionDispatch<[action: Action]>;
}>({
  state: defaultState(),
  dispatch: noop,
});
