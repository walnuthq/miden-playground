import { defaultState, type State } from "@/lib/types/state";
import { storageSlotName, defaultComponent } from "@/lib/types/component";
import defaultComponents from "@/lib/types/default-components";

const state: State = {
  ...defaultState(),
  exampleId: "counter-account",
  components: [
    ...defaultComponents,
    {
      ...defaultComponent(),
      id: "counter-account",
      name: "Counter Contract",
      type: "account",
      scriptId: "",
      storageSlots: [
        {
          name: storageSlotName({
            packageName: "counter-account",
            fieldName: "count_map",
          }),
          type: "map",
          value: "1:0",
        },
      ],
    },
  ],
};

export default state;
