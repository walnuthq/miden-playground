"use client";
import { noop } from "lodash";
import { type ActionDispatch, createContext } from "react";
import type { Action } from "@/components/global-context/reducer";
import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";

export default createContext<{
  state: State;
  dispatch: ActionDispatch<[action: Action]>;
}>({
  state: defaultState(),
  dispatch: noop,
});
