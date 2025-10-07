import { type Component, defaultComponent } from "@/lib/types/component";

const basicFungibleFaucet: Component = {
  ...defaultComponent(),
  id: "basic-fungible-faucet",
  name: "Basic Fungible Faucet",
  type: "account",
  scriptId: "basic-fungible-faucet",
};

export default basicFungibleFaucet;
