import { type Component, defaultComponent } from "@/lib/types/component";

const psm: Component = {
  ...defaultComponent(),
  id: "psm",
  name: "PSM",
  type: "account",
  scriptId: "psm",
  storageSlots: [
    {
      name: "openzeppelin::psm::selector",
      type: "value",
      value: "0",
    },
    {
      name: "openzeppelin::psm::public_key",
      type: "map",
      value: "",
    },
  ],
};

export default psm;
