import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const authEcdsaK256Keccak: Package = {
  ...defaultPackage(),
  id: "auth-ecdsa-k256-keccak",
  name: "auth-ecdsa-k256-keccak",
  type: "authentication-component",
  digest: "0x1217b0e628ccc605a6d2cecb20341545294b448a3828e7f1656ce4d4d7932b37",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::ecdsa_k256_keccak::auth_tx_ecdsa_k256_keccak",
        digest:
          "0xc3e04c25e03931a21c88a32411ba47b5f3641073e8788c797d3c8552342c1a5f",
      },
    },
  ],
};

export default authEcdsaK256Keccak;
