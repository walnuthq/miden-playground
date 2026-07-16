import type { Component } from "@/lib/types/component";
import { defaultComponent } from "@/lib/utils/component";

const basicWallet: Component = {
  ...defaultComponent(),
  id: "basic-wallet",
  name: "Basic Wallet",
  type: "account-component",
  scriptId: "basic-wallet",
};

export default basicWallet;
