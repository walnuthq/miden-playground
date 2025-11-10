import { type Component, defaultComponent } from "@/lib/types/component";

const counterContract: Component = {
  ...defaultComponent(),
  id: "counter-contract",
  name: "Counter Contract",
  type: "account",
  scriptId: "counter-contract",
  storageSlots: [{ name: "Counter", type: "value", value: "0" }],
};

export default counterContract;
