import { initialState, type State } from "@/components/global-context/reducer";

const state: State = {
  ...initialState(),
  networkId: "mtst",
  tutorialId: "deploy-a-counter-contract",
};

export default state;
