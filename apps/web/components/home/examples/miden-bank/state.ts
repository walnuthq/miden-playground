import { defaultState, type State } from "@/lib/types/state";
import { storageSlotName, defaultComponent } from "@/lib/types/component";
import defaultComponents from "@/lib/types/default-components";

const state: State = {
  ...defaultState(),
  exampleId: "bank-account",
  components: [
    ...defaultComponents,
    {
      ...defaultComponent(),
      id: "bank-account",
      name: "Bank Account",
      type: "account",
      scriptId: "",
      storageSlots: [
        {
          name: storageSlotName({
            packageName: "bank-account",
            fieldName: "initialized",
          }),
          type: "value",
          value: "0",
        },
        {
          name: storageSlotName({
            packageName: "bank-account",
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
