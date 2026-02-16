import {
  type Component,
  defaultComponent,
  storageSlotName,
} from "@/lib/types/component";

const getter: Component = {
  ...defaultComponent(),
  id: "getter",
  name: "Getter",
  type: "account",
  scriptId: "getter",
  storageSlots: [
    {
      name: storageSlotName({
        packageName: "getter",
        fieldName: "word",
      }),
      type: "value",
      value: "0",
    },
  ],
};

export default getter;
