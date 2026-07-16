import type { Component } from "@/lib/types/component";
import { defaultComponent, storageSlotName } from "@/lib/utils/component";

const countReader: Component = {
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
        fieldName: "counter",
      }),
      type: "value",
      value: "0",
    },
  ],
};

export default countReader;
