import {
  type Component,
  defaultComponent,
  storageSlotName,
} from "@/lib/types/component";

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
        fieldName: "counter",
      }),
      type: "value",
      value: "0",
    },
  ],
};

export default countReader;
