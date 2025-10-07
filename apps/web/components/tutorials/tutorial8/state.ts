import { type State, defaultState } from "@/lib/types/state";
import defaultScripts from "@/lib/types/default-scripts";
import countReaderScript from "@/lib/types/default-scripts/count-reader";
import counterContractScript from "@/lib/types/default-scripts/counter-contract";
import defaultComponents from "@/lib/types/default-components";
import countReaderComponent from "@/lib/types/default-components/count-reader";
import counterContractComponent from "@/lib/types/default-components/counter-contract";

const state: State = {
  ...defaultState(),
  networkId: "mtst",
  scripts: [...defaultScripts, countReaderScript, counterContractScript],
  components: [
    ...defaultComponents,
    countReaderComponent,
    counterContractComponent,
  ],
  tutorialId: "foreign-procedure-invocation",
};

export default state;
