import { type State, defaultState } from "@/lib/types/state";

const state: State = {
  ...defaultState(),
  networkId: "mtst",
  tutorialId: "deploy-a-counter-contract",
};

export default state;
