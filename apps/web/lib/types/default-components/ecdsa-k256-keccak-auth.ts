import { type Component, defaultComponent } from "@/lib/types/component";

const ecdsaK256KeccakAuth: Component = {
  ...defaultComponent(),
  id: "ecdsa-k256-keccak-auth",
  name: "ECDSA K256 Keccak Auth",
  type: "authentication-component",
  scriptId: "ecdsa-k256-keccak-auth",
  storageSlots: [
    {
      name: "miden::standards::auth::ecdsa_k256_keccak::public_key",
      type: "value",
      value: "0",
    },
  ],
};

export default ecdsaK256KeccakAuth;
