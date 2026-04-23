import type { Component } from "@/lib/types/component";
import { defaultComponent } from "@/lib/utils/component";

const authSingleSig: Component = {
  ...defaultComponent(),
  id: "auth-single-sig",
  name: "Single Sig Auth",
  type: "authentication-component",
  scriptId: "auth-single-sig",
  storageSlots: [
    {
      name: "miden::standards::auth::singlesig::pub_key",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::auth::singlesig::scheme",
      type: "value",
      value: "2",
    },
  ],
};

export default authSingleSig;
