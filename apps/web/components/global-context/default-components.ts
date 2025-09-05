import { type Component } from "@/lib/types";

export const noAuthComponent: Component = {
  id: "no-auth",
  name: "No Auth Component",
  type: "auth",
  scriptId: "no-auth",
  storageSlots: [],
  updatedAt: 0,
};

export const basicAuthComponent: Component = {
  id: "basic-auth",
  name: "Basic Auth Component",
  type: "auth",
  scriptId: "basic-auth",
  storageSlots: [{ name: "Public Key", type: "value", value: "0" }],
  updatedAt: 0,
};

export const basicWalletComponent: Component = {
  id: "basic-wallet",
  name: "Basic Wallet Component",
  type: "account",
  scriptId: "basic-wallet",
  storageSlots: [],
  updatedAt: 0,
};

const defaultComponents = [
  noAuthComponent,
  basicAuthComponent,
  basicWalletComponent,
];

export default defaultComponents;
