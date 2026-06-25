import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const authMultisigSmart: Package = {
  ...defaultPackage(),
  id: "auth-multisig-smart",
  name: "auth-multisig-smart",
  type: "authentication-component",
  digest: "0xcf5218ecb59a324aaa6c9cac921d9636e7d2c9fa18a8b44fcf9d07b5798fbcf6",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig_smart::auth_tx_multisig_smart",
        digest:
          "0xcc323bf946b679925fa6f0e2fab907d8d9523e0287c797f6682f6bf0b4c9fb07",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig_smart::get_signer_at",
        digest:
          "0xbb761f23b6433c4ff9f4f5be9998dd9ad145034b9748587b10ae84f9cd83165d",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig_smart::get_threshold_and_num_approvers",
        digest:
          "0x4d55155362471cdfe1d29f14c7780e9fad10c1154c44b3ee438d5b64f0f54401",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig_smart::is_signer",
        digest:
          "0xba3f0c8869d4cab08df131d6135a5285714a078bfb440c16eef18db5dba0e49c",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig_smart::set_procedure_policy",
        digest:
          "0x47dbaadc2935f52c6aa796b57f49d46213b0a24902019dc87fee8ba843ddcc57",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig_smart::update_signers_and_threshold",
        digest:
          "0xa7b99db78f280024dd2e7b98cd711e06ee5fb44041014e859884117fa389966d",
      },
    },
  ],
};

export default authMultisigSmart;
