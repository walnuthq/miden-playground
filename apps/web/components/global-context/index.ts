"use client";
import { noop } from "lodash";
import { createContext, type ActionDispatch } from "react";
import {
  type State,
  type Action,
  initialState,
} from "@/components/global-context/reducer";

export default createContext<{
  state: State;
  dispatch: ActionDispatch<[action: Action]>;
}>({
  state: initialState(),
  dispatch: noop,
});
