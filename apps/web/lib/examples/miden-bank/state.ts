import defaultComponents from "@/lib/types/default-components";
import type { State } from "@/lib/types/state";
import { midenFaucetAccount } from "@/lib/utils/account";
import { defaultComponent, storageSlotName } from "@/lib/utils/component";
import { defaultState } from "@/lib/utils/state";

const state: State = {
  ...defaultState(),
  exampleId: "bank-account",
  accounts: [midenFaucetAccount("mtst")],
  components: [
    ...defaultComponents,
    {
      ...defaultComponent(),
      id: "bank-account",
      name: "Bank Account",
      type: "account-component",
      scriptId: "",
      storageSlots: [
        {
          name: storageSlotName({
            packageName: "bank-account",
            traitName: "Bank",
            fieldName: "initialized",
          }),
          type: "value",
          value: "0",
        },
        {
          name: storageSlotName({
            packageName: "bank-account",
            traitName: "Bank",
            fieldName: "balances",
          }),
          type: "map",
          value: "",
        },
      ],
    },
  ],
};

export default state;
