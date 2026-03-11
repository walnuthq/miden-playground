import { type State, defaultState } from "@/lib/types/state";

const state: State = {
  ...defaultState(),
  networkId: "mtst",
  tutorialId: "wallet-backup",
};

export default state;
