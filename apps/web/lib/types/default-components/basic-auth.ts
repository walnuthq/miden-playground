import { type Component, defaultComponent } from "@/lib/types/component";

const basicAuth: Component = {
  ...defaultComponent(),
  id: "basic-auth",
  name: "Basic Auth",
  type: "authentication-component",
  scriptId: "basic-auth",
  storageSlots: [{ name: "Owner Public Key", type: "value", value: "0" }],
};

export default basicAuth;
