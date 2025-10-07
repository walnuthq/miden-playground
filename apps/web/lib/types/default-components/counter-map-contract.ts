import { type Component, defaultComponent } from "@/lib/types/component";

const counterMapContract: Component = {
  ...defaultComponent(),
  id: "counter-map-contract",
  name: "Counter Map Contract",
  type: "account",
  scriptId: "counter-map-contract",
  storageSlots: [{ name: "Count Map", type: "map", value: "1:10" }],
};

export default counterMapContract;
