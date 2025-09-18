import { type State, initialState } from "@/components/global-context/reducer";
import { counterContractScript } from "@/components/global-context/default-scripts";
import { counterContractComponent } from "@/components/global-context/default-components";

const state: State = {
  ...initialState(),
  networkId: "mtst",
  scripts: [counterContractScript],
  components: [counterContractComponent],
  tutorialId: "interact-with-the-counter-contract",
};

export default state;
