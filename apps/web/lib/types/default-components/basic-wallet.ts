import { type Component, defaultComponent } from "@/lib/types/component";

const basicWallet: Component = {
  ...defaultComponent(),
  id: "basic-wallet",
  name: "Basic Wallet",
  type: "account",
  scriptId: "basic-wallet",
};

export default basicWallet;
