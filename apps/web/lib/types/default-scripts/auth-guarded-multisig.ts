import type { Script } from "@/lib/types/script";
import { defaultProcedureExport, defaultScript } from "@/lib/utils/script";

export const rust = ``;

export const masm = `# The MASM code of the Multi-Signature Authentication component integrated with a state guardian.
#
# See the \`AuthGuardedMultisig\` Rust type's documentation for more details.

use miden::protocol::tx
use miden::standards::auth::multisig
use miden::standards::auth::guardian
use miden::standards::auth::signature
use miden::standards::fee

pub use {update_signers_and_threshold} from miden::standards::auth::multisig
pub use {get_threshold_and_num_approvers} from miden::standards::auth::multisig
pub use {set_procedure_threshold} from miden::standards::auth::multisig
pub use {get_signer_at} from miden::standards::auth::multisig
pub use {is_signer} from miden::standards::auth::multisig

pub use {update_guardian_public_key} from miden::standards::auth::guardian

#! Authenticate a transaction with multi-signature support and optional guardian verification,
#! paying the transaction fee in the process.
#!
#! The fee is paid as in the multisig component, before the transaction summary is created, so
#! the fee note is covered by the approver and guardian signatures. The cycle estimate counts the
#! guardian as one more signer.
#!
#! The guardian must not be an approver, otherwise a single signature would satisfy both the
#! multisig and the guardian check, so this procedure re-checks the invariant that
#! \`AuthGuardedMultisigConfig::new\` enforces at deployment time. Both sides are read from the
#! current account state, so a guardian rotation or an approver-set update performed by this
#! transaction is covered.
#!
#! Inputs:
#!   Operand stack: [AUTH_ARGS]
#!   Advice map: { AUTH_ARGS: [BLOCK_WORD, SALT, CONVERSION_INFO] }
#! Outputs:
#!   Operand stack: []
#!
#! Where:
#! - AUTH_ARGS and its preimage are as described in \`multisig::resolve_auth_args\`.
#!
#! Panics if:
#! - insufficient number of valid approver or guardian signatures.
#! - the approval expired at or before the transaction reference block, see
#!   \`multisig::assert_approval_not_expired\`.
#! - the configured guardian public key is one of the approver public keys.
#!
#! Invocation: call
@auth_script
pub proc auth_tx_guarded_multisig(auth_args: word)
    exec.multisig::resolve_auth_args
    # => [CONVERSION_INFO, bound_block_num, approval_expiration_block_num, SALT]

    # reject an expired approval before any signature is verified.
    # ---------------------------------------------------------------------------------------------

    dup.5 exec.tx::get_reference_block_number
    # => [reference_block_num, approval_expiration_block_num, CONVERSION_INFO, bound_block_num, approval_expiration_block_num, SALT]

    exec.multisig::assert_approval_not_expired movdn.10
    # => [CONVERSION_INFO, bound_block_num, approval_expiration_block_num, SALT, approval_expiration_delta]

    # check a guardian rotation before the fee note exists, since a rotation must not create notes
    exec.guardian::assert_rotation_policy movdn.11
    # => [CONVERSION_INFO, bound_block_num, approval_expiration_block_num, SALT, approval_expiration_delta, is_rotation]

    # Pay the transaction fee before the summary is created so that the TX_FEE note and the
    # vault withdrawal funding it are covered by the approver and guardian signatures.
    # ---------------------------------------------------------------------------------------------

    exec.multisig::get_initial_threshold_and_num_approvers drop
    # => [num_of_approvers, CONVERSION_INFO, bound_block_num, approval_expiration_block_num, SALT, approval_expiration_delta, is_rotation]

    # count the guardian as a signer; this overestimates a guardian rotation, which skips it
    add.1
    # => [num_of_signers, CONVERSION_INFO, bound_block_num, approval_expiration_block_num, SALT, approval_expiration_delta, is_rotation]

    exec.signature::estimate_multisig_authentication_cycles
    # => [num_extra_cycles, CONVERSION_INFO, bound_block_num, approval_expiration_block_num, SALT, approval_expiration_delta, is_rotation]

    # use the signed block for the fee note.
    dup.5 movdn.5
    # => [num_extra_cycles, CONVERSION_INFO, bound_block_num, bound_block_num, approval_expiration_block_num, SALT, approval_expiration_delta, is_rotation]

    exec.fee::pay_fee drop
    # => [bound_block_num, approval_expiration_block_num, SALT, approval_expiration_delta, is_rotation]

    # Authenticate the transaction with the approvers and the guardian and record it for replay
    # protection.
    # ---------------------------------------------------------------------------------------------

    exec.multisig::auth_tx
    # => [TX_SUMMARY_COMMITMENT, approval_expiration_delta, is_rotation]

    dupw movup.9
    # => [is_rotation, TX_SUMMARY_COMMITMENT, TX_SUMMARY_COMMITMENT, approval_expiration_delta]

    exec.guardian::verify_signature
    # => [TX_SUMMARY_COMMITMENT, approval_expiration_delta]

    exec.guardian::get_guardian_public_key
    # => [GUARDIAN_PUBLIC_KEY, TX_SUMMARY_COMMITMENT, approval_expiration_delta]

    exec.multisig::assert_not_approver_public_key
    # => [TX_SUMMARY_COMMITMENT, approval_expiration_delta]

    exec.multisig::record_and_assert_new_tx
    # => [approval_expiration_delta]

    # apply the approval expiration after tx summary extractions since the host cross-checks
    # the kernel expiration delta against the transaction summary delta
    # ---------------------------------------------------------------------------------------------

    exec.multisig::apply_approval_expiration
    # => []
end
`;

const authGuardedMultisig: Script = {
  ...defaultScript(),
  id: "auth-guarded-multisig",
  name: "auth-guarded-multisig",
  type: "authentication-component",
  status: "compiled",
  readOnly: true,
  rust,
  masm,
  commitment:
    "0x4ec0dd8bf5ced6e758f661aeebe4f1cc6ea6eecf66b7758968ca953a7e9c1348",
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::auth_tx_guarded_multisig",
      digest:
        "0x71ba7380c6138d5e80e911094a9767ed0fa5c8ffefcf6a776754bfc75bc163b9",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::get_signer_at",
      digest:
        "0xa3dfe78fbde4360b3672d7c706d9e089d7b1fd4095fc3da0c5fa02996d91c037",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::get_threshold_and_num_approvers",
      digest:
        "0xa8b67a43d85279823c2ee823bd5498075a11e78906c834bdaf0e0d5471d43013",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::is_signer",
      digest:
        "0x7ccc1a2ab4eeaf7504540fc0845df07021137ab75778d998c72a46dce3f0b4a3",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::set_procedure_threshold",
      digest:
        "0xa32cd13808fd8fb91adb3dceaed4d8faebc3bd80fa49c2903be4b8d7bf89ba77",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::update_guardian_public_key",
      digest:
        "0x93dedb135fd5bb7112c07aacf4a5680ddc76e45ecf043bfc42ea735b6d971911",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::update_signers_and_threshold",
      digest:
        "0x0f664cdaae422fe43bb45d959c7e469b0c855ad1fc4e79fddd730ec3cb983c6e",
    },
  ],
};

export default authGuardedMultisig;
