import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";
import { storageSlotName, defaultComponent } from "@/lib/utils/component";
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
            componentStruct: "CounterContract",
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
