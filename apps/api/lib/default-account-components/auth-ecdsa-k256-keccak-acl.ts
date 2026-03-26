import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const authEcdsaK256KeccakAcl: Package = {
  ...defaultPackage(),
  id: "auth-ecdsa-k256-keccak-acl",
  name: "auth-ecdsa-k256-keccak-acl",
  type: "authentication-component",
  digest: "0xde30d01a3a20f3cbda96b8a6e79f1b17bcc2e0615314ea7c72b99fa83c25798f",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::ecdsa_k256_keccak_acl::auth_tx_ecdsa_k256_keccak_acl",
        digest:
          "0xce9969e38acb7248cc1f70adac910498f78d72233197ed03e78e5b1059c2f7c8",
      },
    },
  ],
};

export default authEcdsaK256KeccakAcl;
