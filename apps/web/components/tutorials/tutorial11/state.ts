import { type State, defaultState } from "@/lib/types/state";

const state: State = {
  ...defaultState(),
  networkId: "mtst",
  tutorialId: "contract-verification",
};

export default state;
