import { type State, defaultState } from "@/lib/types/state";

const state: State = {
  ...defaultState(),
  networkId: "mtst",
  tutorialId: "timelock-p2id-note",
};

export default state;
