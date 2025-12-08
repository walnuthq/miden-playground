import { type Component, defaultComponent } from "@/lib/types/component";

const getter: Component = {
  ...defaultComponent(),
  id: "getter",
  name: "Getter",
  type: "account",
  scriptId: "getter",
  storageSlots: [{ name: "word", type: "value", value: "0" }],
};

export default getter;
