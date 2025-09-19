import { type Component } from "@/lib/types/component";

export const noAuthComponent: Component = {
  id: "no-auth",
  name: "No Auth",
  type: "auth",
  scriptId: "no-auth",
  storageSlots: [],
  procedures: [],
  updatedAt: 0,
};

export const basicAuthComponent: Component = {
  id: "basic-auth",
  name: "Basic Auth",
  type: "auth",
  scriptId: "basic-auth",
  storageSlots: [{ name: "Public Key", type: "value", value: "0" }],
  procedures: [],
  updatedAt: 0,
};

export const basicWalletComponent: Component = {
  id: "basic-wallet",
  name: "Basic Wallet",
  type: "account",
  scriptId: "basic-wallet",
  storageSlots: [],
  procedures: [],
  updatedAt: 0,
};

export const counterContractComponent: Component = {
  id: "counter-contract",
  name: "Counter Contract",
  type: "account",
  scriptId: "counter-contract",
  // storageSlots: [{ name: "Count Map", type: "map", value: "1:10" }],
  storageSlots: [{ name: "Counter", type: "value", value: "1" }],
  procedures: [
    {
      name: "get_count",
      args: [],
      returnType: "felt",
      readOnly: true,
      storageRead: { type: "value", index: 0 },
    },
    { name: "increment_count", args: [], returnType: "felt", readOnly: false },
  ],
  updatedAt: 0,
};

export const counterMapContractComponent: Component = {
  id: "counter-map-contract",
  name: "Counter Map Contract",
  type: "account",
  scriptId: "counter-map-contract",
  storageSlots: [{ name: "Count Map", type: "map", value: "1:10" }],
  procedures: [
    {
      name: "get_count",
      args: [],
      returnType: "felt",
      readOnly: true,
      storageRead: { type: "map", index: 0, key: [0n, 0n, 0n, 1n] },
    },
    { name: "increment_count", args: [], returnType: "felt", readOnly: false },
  ],
  updatedAt: 0,
};

const defaultComponents = [
  noAuthComponent,
  basicAuthComponent,
  basicWalletComponent,
];

export default defaultComponents;
