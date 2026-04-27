import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";
import defaultScripts from "@/lib/types/default-scripts";
import counterContractScript from "@/lib/types/default-scripts/counter-contract";
import counterNoteScript from "@/lib/types/default-scripts/counter-note";
import defaultComponents from "@/lib/types/default-components";
import counterContractComponent from "@/lib/types/default-components/counter-contract";

const state: State = {
  ...defaultState(),
  scripts: [
    ...defaultScripts,
    { ...counterContractScript, id: "counter-value-contract" },
    {
      ...counterNoteScript,
      dependencies: [
        {
          id: "counter-value-contract",
          name: "counter-value-contract",
          type: "account",
          digest: "",
        },
      ],
    },
  ],
  components: [
    ...defaultComponents,
    {
      ...counterContractComponent,
      id: "counter-value-contract",
      scriptId: "counter-value-contract",
    },
  ],
  tutorialId: "network-transactions",
};

export default state;
