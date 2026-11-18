import {
  counterContractAccountId,
  counterContractAddress,
} from "@/lib/constants";
import countReaderScript from "@/lib/tutorials/count-reader";
import { counterAccountScript } from "@/lib/tutorials/counter-account";
import defaultScripts from "@/lib/types/default-scripts";
import type { State } from "@/lib/types/state";
import {
  defaultAccount,
  getIdentifierPart,
  getRoutingParametersPart,
  midenFaucetAccount,
} from "@/lib/utils/account";
import { defaultState } from "@/lib/utils/state";

// The counter tutorial 6 imports: the same `counter-account` instance, here
// pre-imported so the tutorial starts at the Count Reader. Its components are
// script ids (the embedded scripts keep the built-in packages' ids).
const state: State = {
  ...defaultState(),
  accounts: [
    midenFaucetAccount("mtst"),
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
      components: ["auth-no-auth", "basic-wallet", "counter-account"],
    },
  ],
  scripts: [...defaultScripts, counterAccountScript, countReaderScript],
  tutorialId: "foreign-procedure-invocation",
};

export default state;
