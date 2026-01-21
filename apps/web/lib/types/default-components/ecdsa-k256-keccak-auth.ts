import { type Component, defaultComponent } from "@/lib/types/component";

const ecdsaK256KeccakAuth: Component = {
  ...defaultComponent(),
  id: "ecdsa-k256-keccak-auth",
  name: "ECDSA K256 Keccak Auth",
  type: "authentication-component",
  scriptId: "ecdsa-k256-keccak-auth",
  storageSlots: [{ name: "Owner Public Key", type: "value", value: "0" }],
};

export default ecdsaK256KeccakAuth;
