import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const authMultisig: Package = {
  ...defaultPackage(),
  id: "auth-multisig",
  name: "auth-multisig",
  type: "authentication-component",
  digest: "0x0228b1242302f083a719fe19af06157ddbb7eb86b0954aa4d480c0b98b03ba7d",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig::auth_tx_multisig",
        digest:
          "0x21cda5a00e54eca03447294a170f851f5149ed1bb64b9399e7569549020843ef",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig::get_signer_at",
        digest:
          "0xbb761f23b6433c4ff9f4f5be9998dd9ad145034b9748587b10ae84f9cd83165d",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig::get_threshold_and_num_approvers",
        digest:
          "0x4d55155362471cdfe1d29f14c7780e9fad10c1154c44b3ee438d5b64f0f54401",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig::is_signer",
        digest:
          "0xba3f0c8869d4cab08df131d6135a5285714a078bfb440c16eef18db5dba0e49c",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig::set_procedure_threshold",
        digest:
          "0x9bee1ea89c844874d7f3c63bba52b277a429679028dc3a4e27c54db6cf4f158d",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig::update_signers_and_threshold",
        digest:
          "0xe60215c664714037ad08811093b3685a6ace65c78351263473298cce9c7600e3",
      },
    },
  ],
};

export default authMultisig;
