import type { Component } from "@/lib/types/component";
import { defaultComponent, storageSlotName } from "@/lib/utils/component";

const countReader: Component = {
  ...defaultComponent(),
  id: "count-reader",
  name: "Count Reader",
  type: "account",
  scriptId: "count-reader",
  storageSlots: [
    {
      name: storageSlotName({
        packageName: "count-reader",
        componentStruct: "CountReader",
        fieldName: "counter",
      }),
      type: "value",
      value: "0",
    },
  ],
};

export default countReader;
