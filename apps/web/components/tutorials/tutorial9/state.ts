import { type State, defaultState } from "@/lib/types/state";
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
} from "@/lib/types/account";
import {
  COUNTER_CONTRACT_ACCOUNT_ID,
  COUNTER_CONTRACT_ADDRESS,
} from "@/lib/constants";

const state: State = {
  ...defaultState(),
  networkId: "mtst",
  accounts: [
    {
      ...defaultAccount(),
      id: COUNTER_CONTRACT_ACCOUNT_ID,
      name: "Counter Contract",
      address: COUNTER_CONTRACT_ADDRESS,
      identifier: getIdentifierPart(COUNTER_CONTRACT_ADDRESS),
      routingParameters: getRoutingParametersPart(COUNTER_CONTRACT_ADDRESS),
      type: "regular-account-updatable-code",
      storageMode: "public",
      isPublic: true,
      isUpdatable: true,
      isRegularAccount: true,
      components: ["no-auth", "counter-contract"],
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
