import type { Component } from "@/lib/types/component";
import { defaultComponent } from "@/lib/utils/component";

const basicFungibleFaucet: Component = {
  ...defaultComponent(),
  id: "basic-fungible-faucet",
  name: "Basic Fungible Faucet",
  type: "account",
  scriptId: "basic-fungible-faucet",
  storageSlots: [
    {
      name: "miden::standards::fungible_faucets::metadata",
      type: "value",
      value: "0",
    },
  ],
};

export default basicFungibleFaucet;
