import { type State, initialState } from "@/components/global-context/reducer";

const state: State = {
  ...initialState(),
  networkId: "mtst",
  tutorialId: "connect-wallet-and-sign-transactions",
};

export default state;
