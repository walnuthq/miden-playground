import type { Component } from "@/lib/types/component";
import { defaultComponent } from "@/lib/utils/component";

const authNetworkAccount: Component = {
  ...defaultComponent(),
  id: "auth-network-account",
  name: "Network Account",
  type: "authentication-component",
  scriptId: "auth-network-account",
  storageSlots: [
    {
      name: "miden::standards::auth::network_account::allowed_note_scripts",
      type: "map",
      value: "",
    },
    {
      name: "miden::standards::auth::network_account::allowed_tx_scripts",
      type: "map",
      value: "",
    },
  ],
};

export default authNetworkAccount;
