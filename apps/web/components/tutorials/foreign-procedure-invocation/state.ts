import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";
import defaultScripts from "@/lib/types/default-scripts";
import counterMapContractScript from "@/lib/types/default-scripts/counter-map-contract";
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
      isFaucet: false,
      isPublic: true,
      isPrivate: false,
      isRegularAccount: true,
      isNew: false,
      components: ["auth-no-auth", "counter-contract"],
    },
  ],
  scripts: [
    ...defaultScripts,
    {
      ...counterMapContractScript,
      id: "counter-account",
      name: "counter-account",
    },
  ],
  tutorialId: "foreign-procedure-invocation",
};

export default state;
