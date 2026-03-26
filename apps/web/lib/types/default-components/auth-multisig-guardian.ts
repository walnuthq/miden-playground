import { type Component, defaultComponent } from "@/lib/types/component";

const authMultisigGuardian: Component = {
  ...defaultComponent(),
  id: "auth-multisig-guardian",
  name: "Multisig Guardian Auth",
  type: "authentication-component",
  scriptId: "auth-multisig-guardian",
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
    {
      name: "openzeppelin::guardian::selector",
      type: "value",
      value: "0",
    },
    {
      name: "openzeppelin::guardian::public_key",
      type: "map",
      value: "",
    },
  ],
};

export default authMultisigGuardian;
