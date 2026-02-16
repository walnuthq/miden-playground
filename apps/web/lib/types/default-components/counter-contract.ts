import {
  type Component,
  defaultComponent,
  storageSlotName,
} from "@/lib/types/component";

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
        fieldName: "counter",
      }),
      type: "value",
      value: "0",
    },
  ],
};

export default counterContract;
