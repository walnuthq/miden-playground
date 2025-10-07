import { type Component, defaultComponent } from "@/lib/types/component";

const countReader: Component = {
  ...defaultComponent(),
  id: "count-reader",
  name: "Count Reader",
  type: "account",
  scriptId: "count-reader",
  storageSlots: [{ name: "Counter", type: "value", value: "0" }],
};

export default countReader;
