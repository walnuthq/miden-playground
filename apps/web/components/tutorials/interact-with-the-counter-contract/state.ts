import defaultComponents from "@/lib/types/default-components";
import counterContractComponent from "@/lib/types/default-components/counter-contract";
import defaultScripts from "@/lib/types/default-scripts";
import counterContractScript from "@/lib/types/default-scripts/counter-contract";
import type { State } from "@/lib/types/state";
import { midenFaucetAccount } from "@/lib/utils/account";
import { defaultState } from "@/lib/utils/state";

const state: State = {
  ...defaultState(),
  accounts: [midenFaucetAccount("mtst")],
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
