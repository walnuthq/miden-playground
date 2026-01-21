import { type Component, defaultComponent } from "@/lib/types/component";

const rpoFalcon512Auth: Component = {
  ...defaultComponent(),
  id: "rpo-falcon-512-auth",
  name: "RPO Falcon 512 Auth",
  type: "authentication-component",
  scriptId: "rpo-falcon-512-auth",
  storageSlots: [{ name: "Owner Public Key", type: "value", value: "0" }],
};

export default rpoFalcon512Auth;
