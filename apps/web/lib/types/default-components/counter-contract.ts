import type { Component } from "@/lib/types/component";
import { defaultComponent, storageSlotName } from "@/lib/utils/component";

const counterContract: Component = {
  ...defaultComponent(),
  id: "counter-contract",
  name: "Counter Contract",
  type: "account",
  scriptId: "counter-contract",
  storageSlots: [
    {
      name: storageSlotName({
        packageName: "counter-contract",
        componentStruct: "CounterContract",
        fieldName: "count",
      }),
      type: "value",
      value: "0",
    },
  ],
};

export default counterContract;
