import { type Component, defaultComponent } from "@/lib/types/component";

const authNoAuth: Component = {
  ...defaultComponent(),
  id: "auth-no-auth",
  name: "No Auth",
  type: "authentication-component",
  scriptId: "auth-no-auth",
};

export default authNoAuth;
