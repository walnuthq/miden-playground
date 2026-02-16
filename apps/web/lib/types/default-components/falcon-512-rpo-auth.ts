import { type Component, defaultComponent } from "@/lib/types/component";

const falcon512RpoAuth: Component = {
  ...defaultComponent(),
  id: "falcon-512-rpo-auth",
  name: "Falcon 512 RPO Auth",
  type: "authentication-component",
  scriptId: "falcon-512-rpo-auth",
  storageSlots: [
    {
      name: "miden::standards::auth::falcon512_rpo::public_key",
      type: "value",
      value: "0",
    },
  ],
};

export default falcon512RpoAuth;
