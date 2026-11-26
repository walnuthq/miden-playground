import {
  counterContractAccountId,
  counterContractAddress,
} from "@/lib/constants";
import type { Account } from "@/lib/types/account";
import defaultScripts from "@/lib/types/default-scripts";
import type { State } from "@/lib/types/state";
import {
  defaultAccount,
  getIdentifierPart,
  getRoutingParametersPart,
  midenFaucetAccount,
} from "@/lib/utils/account";
import { defaultState } from "@/lib/utils/state";

// The counter tutorial 6 imports (counterContractAddress), pre-imported so the
// tutorial starts at the Count Reader. Its components are script ids, and its
// counter component is the counter-account script the starter adds (index.ts),
// whose id is the API's: the starter adds the account too.
export const counterContractAccount = (counterScriptId: string): Account => ({
  ...defaultAccount(),
  id: counterContractAccountId("mtst"),
  name: "Counter Contract",
  address: counterContractAddress("mtst"),
  identifier: getIdentifierPart(counterContractAddress("mtst")),
  routingParameters: getRoutingParametersPart(counterContractAddress("mtst")),
  isFaucet: false,
  isPublic: true,
  isPrivate: false,
  isRegularAccount: true,
  isNew: false,
  components: ["auth-no-auth", "basic-wallet", counterScriptId],
});

const state: State = {
  ...defaultState(),
  accounts: [midenFaucetAccount("mtst")],
  scripts: defaultScripts,
  tutorialId: "foreign-procedure-invocation",
};

export default state;
