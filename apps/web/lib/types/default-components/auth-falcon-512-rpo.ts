import { type Component, defaultComponent } from "@/lib/types/component";

const authFalcon512Rpo: Component = {
  ...defaultComponent(),
  id: "auth-falcon-512-rpo",
  name: "Falcon 512 RPO Auth",
  type: "authentication-component",
  scriptId: "auth-falcon-512-rpo",
  storageSlots: [
    {
      name: "miden::standards::auth::falcon512_rpo::public_key",
      type: "value",
      value: "0",
    },
  ],
};

export default authFalcon512Rpo;
