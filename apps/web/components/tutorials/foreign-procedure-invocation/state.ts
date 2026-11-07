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

const COUNTER_CONTRACT_ID = "0x7240e428d9f88611442761fe8f572b";
const COUNTER_CONTRACT_ADDRESS =
  "mtst1apeypepgm8ugvy2yyaslar6h9vdvwmz4_qr7qqq9wr6w";

const state: State = {
  ...defaultState(),
  accounts: [
    midenFaucetAccount("mtst"),
    {
      ...defaultAccount(),
      id: COUNTER_CONTRACT_ID,
      name: "Counter Contract",
      address: COUNTER_CONTRACT_ADDRESS,
      identifier: getIdentifierPart(COUNTER_CONTRACT_ADDRESS),
      routingParameters: getRoutingParametersPart(COUNTER_CONTRACT_ADDRESS),
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
