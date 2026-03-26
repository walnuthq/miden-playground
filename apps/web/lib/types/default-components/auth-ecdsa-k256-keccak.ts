import { type Component, defaultComponent } from "@/lib/types/component";

const authEcdsaK256Keccak: Component = {
  ...defaultComponent(),
  id: "auth-ecdsa-k256-keccak",
  name: "ECDSA K256 Keccak Auth",
  type: "authentication-component",
  scriptId: "auth-ecdsa-k256-keccak",
  storageSlots: [
    {
      name: "miden::standards::auth::ecdsa_k256_keccak::public_key",
      type: "value",
      value: "0",
    },
  ],
};

export default authEcdsaK256Keccak;
