import { type State, defaultState } from "@/lib/types/state";
import defaultScripts from "@/lib/types/default-scripts";
import counterContractScript from "@/lib/types/default-scripts/counter-contract";
import defaultComponents from "@/lib/types/default-components";
import counterContractComponent from "@/lib/types/default-components/counter-contract";

const state: State = {
  ...defaultState(),
  networkId: "mtst",
  scripts: [
    ...defaultScripts,
    { ...counterContractScript, id: "counter-value-contract" },
  ],
  components: [
    ...defaultComponents,
    {
      ...counterContractComponent,
      id: "counter-value-contract",
      scriptId: "counter-value-contract",
    },
  ],
  tutorialId: "interact-with-the-counter-contract",
};

export default state;
