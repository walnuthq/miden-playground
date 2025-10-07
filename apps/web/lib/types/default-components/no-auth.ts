import { type Component, defaultComponent } from "@/lib/types/component";

const noAuth: Component = {
  ...defaultComponent(),
  id: "no-auth",
  name: "No Auth",
  type: "auth",
  scriptId: "no-auth",
};

export default noAuth;
