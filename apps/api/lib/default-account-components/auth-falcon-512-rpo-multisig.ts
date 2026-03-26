import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const authFalcon512RpoMultisig: Package = {
  ...defaultPackage(),
  id: "auth-falcon-512-rpo-multisig",
  name: "auth-falcon-512-rpo-multisig",
  type: "authentication-component",
  digest: "0x98bc42df9566693c300d4add2a0e48c1d27b3ccf2ecaf80726bb854eb2766edf",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::falcon_512_rpo_multisig::auth_tx_falcon512_rpo_multisig",
        digest:
          "0x659663b5dae307b9d39938a17456cfa23d5ee41ba84fe5e2eb12f0feacd6fc8f",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::falcon_512_rpo_multisig::update_signers_and_threshold",
        digest:
          "0x37f9f50b2edce69c3c14744f4cfce8c5a1a8b86230181e3e6b7c5476930ee873",
      },
    },
  ],
};

export default authFalcon512RpoMultisig;
