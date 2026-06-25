import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const authGuardedMultisig: Package = {
  ...defaultPackage(),
  id: "auth-guarded-multisig",
  name: "auth-guarded-multisig",
  type: "authentication-component",
  digest: "0x3fbef95713c0228e0a4865571718969d3fd694fbb045c8136eb07a1e8f3193cf",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::guarded_multisig::auth_tx_guarded_multisig",
        digest:
          "0x08f59357487cebf34c4557dd9fc32cecb82d9f7b3d3bba213a68a9729e463260",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::guarded_multisig::get_signer_at",
        digest:
          "0xbb761f23b6433c4ff9f4f5be9998dd9ad145034b9748587b10ae84f9cd83165d",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::guarded_multisig::get_threshold_and_num_approvers",
        digest:
          "0x4d55155362471cdfe1d29f14c7780e9fad10c1154c44b3ee438d5b64f0f54401",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::guarded_multisig::is_signer",
        digest:
          "0xba3f0c8869d4cab08df131d6135a5285714a078bfb440c16eef18db5dba0e49c",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::guarded_multisig::set_procedure_threshold",
        digest:
          "0x9bee1ea89c844874d7f3c63bba52b277a429679028dc3a4e27c54db6cf4f158d",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::guarded_multisig::update_guardian_public_key",
        digest:
          "0x0a614ff7c81a561cbd2a4c2d9482031a7a841ca5de33349daed23a9d871b3675",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::guarded_multisig::update_signers_and_threshold",
        digest:
          "0xe60215c664714037ad08811093b3685a6ace65c78351263473298cce9c7600e3",
      },
    },
  ],
};

export default authGuardedMultisig;
