import type { Component } from "@/lib/types/component";
import { defaultComponent, storageSlotName } from "@/lib/utils/component";

const counterMapContract: Component = {
  ...defaultComponent(),
  id: "counter-map-contract",
  name: "Counter Map Contract",
  type: "account",
  scriptId: "counter-map-contract",
  storageSlots: [
    {
      name: storageSlotName({
        packageName: "counter-contract",
        componentStruct: "CounterContract",
        fieldName: "count_map",
      }),
      type: "map",
      value: "1:0",
    },
  ],
};

export default counterMapContract;
