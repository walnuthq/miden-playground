import { type Component, defaultComponent } from "@/lib/types/component";

const multisig: Component = {
  ...defaultComponent(),
  id: "multisig",
  name: "Multisig",
  type: "authentication-component",
  scriptId: "multisig",
  storageSlots: [
    {
      name: "openzeppelin::multisig::threshold_config",
      type: "value",
      value: "0",
    },
    {
      name: "openzeppelin::multisig::signer_public_keys",
      type: "map",
      value: "",
    },
    {
      name: "openzeppelin::multisig::executed_transactions",
      type: "map",
      value: "",
    },
    {
      name: "openzeppelin::multisig::procedure_thresholds",
      type: "map",
      value: "",
    },
  ],
};

export default multisig;
