import { type State, defaultState } from "@/lib/types/state";
import defaultScripts from "@/lib/types/default-scripts";
import counterMapContractScript from "@/lib/types/default-scripts/counter-map-contract";
import defaultComponents from "@/lib/types/default-components";
import counterMapContractComponent from "@/lib/types/default-components/counter-map-contract";

const state: State = {
  ...defaultState(),
  networkId: "mtst",
  scripts: [...defaultScripts, counterMapContractScript],
  components: [...defaultComponents, counterMapContractComponent],
  tutorialId: "create-a-counter-note",
};

export default state;
