import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const authFalcon512RpoMultisig: Package = {
  ...defaultPackage(),
  id: "auth-multisig",
  name: "auth-multisig",
  type: "authentication-component",
  digest: "0xe87e60785d676aff840291889154aefe8d92d36d286532977e347fc979b80228",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig::auth_tx_multisig",
        digest:
          "0xe9a69d090ea79ba0fc701c31ad92b54e9b289145fc73371bf7295c14b0d3b534",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig::get_signer_at",
        digest:
          "0xdc955105bbe228cc5d3f8cbf93c74d847e561eb7c60c375cab8b85c7d2dc8b29",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig::get_threshold_and_num_approvers",
        digest:
          "0xb5bcd43226fefdb86b534c957619bdfb5d7797b46a2657e6f22040673bbb17fa",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig::is_signer",
        digest:
          "0x6d7f79a7f141410d51dd39c735e1018053265b411f3929739a41cf62b6de8214",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig::set_procedure_threshold",
        digest:
          "0x08628d16e56ab3aa096d9c43ffda164a8a10d1a78e1b51dc955fde2e01653634",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig::update_signers_and_threshold",
        digest:
          "0x2002aa8d26cd747655342132dc0881c2a4e71aa5572ea634ebc6e13836bc508f",
      },
    },
  ],
};

export default authFalcon512RpoMultisig;
