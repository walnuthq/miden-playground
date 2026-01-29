import { type State, defaultState } from "@/lib/types/state";

const state: State = {
  ...defaultState(),
  networkId: "mtst",
  tutorialId: "private-transfers",
};

export default state;
