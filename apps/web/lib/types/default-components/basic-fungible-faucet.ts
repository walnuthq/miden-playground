import { type Component, defaultComponent } from "@/lib/types/component";

const basicFungibleFaucet: Component = {
  ...defaultComponent(),
  id: "basic-fungible-faucet",
  name: "Basic Fungible Faucet",
  type: "account",
  scriptId: "basic-fungible-faucet",
  storageSlots: [
    { name: "miden::protocol::faucet::sysdata", type: "value", value: "0" },
    {
      name: "miden::standards::fungible_faucets::metadata",
      type: "value",
      value: "0",
    },
  ],
};

export default basicFungibleFaucet;
