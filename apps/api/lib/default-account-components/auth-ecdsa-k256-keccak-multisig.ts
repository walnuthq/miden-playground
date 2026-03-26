import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const authEcdsaK256KeccakMultisig: Package = {
  ...defaultPackage(),
  id: "auth-ecdsa-k256-keccak-multisig",
  name: "auth-ecdsa-k256-keccak-multisig",
  type: "authentication-component",
  digest: "0xdb773c9b419986b2d8b3d9ba241c3a71b9837c5133c0264dc0bc078c3a5a9a00",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::ecdsa_k256_keccak_multisig::auth_tx_ecdsa_k256_keccak_multisig",
        digest:
          "0xd2785096bba9f8dd536f65f608cbbff0d46454702b5bffdb873a061c74d8973e",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::ecdsa_k256_keccak_multisig::update_signers_and_threshold",
        digest:
          "0xa698578f7af55d0f2b32555edd6bcd29369342c6c2124727d33ac6575f020132",
      },
    },
  ],
};

export default authEcdsaK256KeccakMultisig;
