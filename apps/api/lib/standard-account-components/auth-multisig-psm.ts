import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const masm = `# The MASM code of the Multi-Signature Authentication component integrated with a state guardian.
#
// # See the \`AuthGuardedMultisig\` Rust type's documentation for more details.

use miden::standards::auth::multisig
use miden::standards::auth::guardian

pub use multisig::update_signers_and_threshold
pub use multisig::get_threshold_and_num_approvers
pub use multisig::set_procedure_threshold
pub use multisig::get_signer_at
pub use multisig::is_signer

pub use guardian::update_guardian_public_key

#! Authenticate a transaction with multi-signature support and optional guardian verification.
#!
#! Inputs:
#!   Operand stack: [SALT]
#! Outputs:
#!   Operand stack: []
#!
#! Invocation: call
@auth_script
pub proc auth_tx_guarded_multisig(salt: word)
    exec.multisig::auth_tx
    # => [TX_SUMMARY_COMMITMENT]

    dupw
    # => [TX_SUMMARY_COMMITMENT, TX_SUMMARY_COMMITMENT]
    
    exec.guardian::verify_signature
    # => [TX_SUMMARY_COMMITMENT]

    exec.multisig::assert_new_tx
    # => []
end
`;

const authMultisigPsm: Package = {
  ...defaultPackage(),
  id: "auth-multisig-psm",
  name: "auth-multisig-psm",
  type: "authentication-component",
  masm,
  digest: "0x1c2a0fb796823ecc8226952bb27f52542e3810f060b705560972bf65711eabd6",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig_psm::auth_tx_multisig_psm",
        digest:
          "0x00b4d83cfad20f0817a754d18d516f57a1f6f74e00b1d45820430ad57db8c01f",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig_psm::get_signer_at",
        digest:
          "0xdc955105bbe228cc5d3f8cbf93c74d847e561eb7c60c375cab8b85c7d2dc8b29",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig_psm::get_threshold_and_num_approvers",
        digest:
          "0xb5bcd43226fefdb86b534c957619bdfb5d7797b46a2657e6f22040673bbb17fa",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig_psm::is_signer",
        digest:
          "0x6d7f79a7f141410d51dd39c735e1018053265b411f3929739a41cf62b6de8214",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig_psm::set_procedure_threshold",
        digest:
          "0x08628d16e56ab3aa096d9c43ffda164a8a10d1a78e1b51dc955fde2e01653634",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig_psm::update_psm_public_key",
        digest:
          "0x27da68cd07effaecb315efa5a43892dfe0309343b7ac84398736c4b5af2d1a69",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::multisig_psm::update_signers_and_threshold",
        digest:
          "0x2002aa8d26cd747655342132dc0881c2a4e71aa5572ea634ebc6e13836bc508f",
      },
    },
  ],
};

export default authMultisigPsm;
