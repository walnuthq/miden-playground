import {
  counterContractAccountId,
  counterContractAddress,
} from "@/lib/constants";
import {
  counterAccountComponent,
  counterAccountScript,
} from "@/lib/tutorials/counter-account";
import defaultComponents from "@/lib/types/default-components";
import defaultScripts from "@/lib/types/default-scripts";
import countReaderScript from "@/lib/types/default-scripts/count-reader";
import type { State } from "@/lib/types/state";
import {
  defaultAccount,
  getIdentifierPart,
  getRoutingParametersPart,
  midenFaucetAccount,
} from "@/lib/utils/account";
import { defaultComponent, storageSlotName } from "@/lib/utils/component";
import { defaultState } from "@/lib/utils/state";

// The counter tutorial 6 imports: the same `counter-account` instance, here
// pre-imported so the tutorial starts at the Count Reader.
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
  components: [
    ...defaultComponents,
    counterAccountComponent,
    {
      ...defaultComponent(),
      id: "count-reader",
      name: "Count Reader",
      type: "account-component",
      scriptId: "count-reader",
      storageSlots: [
        {
          name: storageSlotName({
            packageName: "count-reader",
            traitName: "CountReader",
            fieldName: "count",
          }),
          type: "value",
          value: "0",
        },
      ],
    },
  ],
  tutorialId: "foreign-procedure-invocation",
};

export default state;
