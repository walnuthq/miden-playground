import { type State, initialState } from "@/components/global-context/reducer";
import defaultScripts, {
  counterContractScript,
} from "@/components/global-context/default-scripts";
import defaultComponents, {
  counterContractComponent,
} from "@/components/global-context/default-components";

const state: State = {
  ...initialState(),
  networkId: "mtst",
  scripts: [...defaultScripts, counterContractScript],
  components: [...defaultComponents, counterContractComponent],
  tutorialId: "interact-with-the-counter-contract",
};

export default state;
