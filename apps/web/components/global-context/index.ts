"use client";
import { noop } from "lodash";
import { createContext, type ActionDispatch } from "react";
import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";
import type { Action } from "@/components/global-context/reducer";

export default createContext<{
  state: State;
  dispatch: ActionDispatch<[action: Action]>;
}>({
  state: defaultState(),
  dispatch: noop,
});
