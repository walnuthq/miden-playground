import type { Component } from "@/lib/types/component";
import { defaultComponent } from "@/lib/utils/component";

const authNoAuth: Component = {
  ...defaultComponent(),
  id: "auth-no-auth",
  name: "No Auth",
  type: "authentication-component",
  scriptId: "auth-no-auth",
};

export default authNoAuth;
