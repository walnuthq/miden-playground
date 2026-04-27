import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";
import defaultScripts from "@/lib/types/default-scripts";
import countReaderScript from "@/lib/types/default-scripts/count-reader";
import counterContractScript from "@/lib/types/default-scripts/counter-contract";
import defaultComponents from "@/lib/types/default-components";
import countReaderComponent from "@/lib/types/default-components/count-reader";
import counterContractComponent from "@/lib/types/default-components/counter-contract";
import {
  defaultAccount,
  getIdentifierPart,
  getRoutingParametersPart,
} from "@/lib/utils/account";
import {
  counterContractAccountId,
  counterContractAddress,
} from "@/lib/constants";

const state: State = {
  ...defaultState(),
  accounts: [
    {
      ...defaultAccount(),
      id: counterContractAccountId("mtst"),
      name: "Counter Contract",
      address: counterContractAddress("mtst"),
      identifier: getIdentifierPart(counterContractAddress("mtst")),
      routingParameters: getRoutingParametersPart(
        counterContractAddress("mtst"),
      ),
      type: "regular-account-updatable-code",
      storageMode: "public",
      isFaucet: false,
      isPublic: true,
      isUpdatable: true,
      isRegularAccount: true,
      isNew: false,
      components: ["auth-no-auth", "counter-contract"],
    },
  ],
  scripts: [...defaultScripts, countReaderScript, counterContractScript],
  components: [
    ...defaultComponents,
    countReaderComponent,
    counterContractComponent,
  ],
  tutorialId: "foreign-procedure-invocation",
};

export default state;
