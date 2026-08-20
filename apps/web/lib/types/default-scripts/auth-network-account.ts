import type { Script } from "@/lib/types/script";
import { defaultProcedureExport, defaultScript } from "@/lib/utils/script";

export const rust = ``;

export const masm = `# The MASM code of the AuthNetworkAccount authentication component.
#
# See the \`AuthNetworkAccount\` Rust type's documentation for more details.

use miden::protocol::active_account
use miden::protocol::native_account
use miden::core::word
use miden::standards::auth::note_script_allowlist
use miden::standards::auth::tx_script_allowlist

# CONSTANTS
# =================================================================================================

# The slot holding the map of allowed input-note script roots. Keys are note script roots
# (defined as Word); any non-empty value marks a root as allowed.
const ALLOWED_NOTE_SCRIPTS_SLOT = word("miden::standards::auth::network_account::allowed_note_scripts")

# The slot holding the map of allowed tx script roots. Keys are tx script roots (defined as Word);
# any non-empty value marks a root as allowed.
const ALLOWED_TX_SCRIPTS_SLOT = word("miden::standards::auth::network_account::allowed_tx_scripts")

# AUTH PROCEDURE
# =================================================================================================

#! Authenticates a transaction against an \`AuthNetworkAccount\` component.
#!
#! Enforces two invariants:
#! 1. The transaction script root, if any, must be present in the allowlist stored at
#!    \`ALLOWED_TX_SCRIPTS_SLOT\` (a transaction that executed no tx script is always allowed).
#! 2. Every consumed input note must have a script root present in the allowlist stored at
#!    \`ALLOWED_NOTE_SCRIPTS_SLOT\`.
#!
#! If both checks pass, the nonce is incremented when the account state changed or the account is
#! new, matching the behavior of the NoAuth and SingleSig components.
#!
#! Inputs:  [pad(16)]
#! Outputs: [pad(16)]
#!
#! Invocation: call
@auth_script
pub proc auth_network_transaction(auth_args: word)
    dropw
    # => [pad(16)]

    # ---- Reject any tx script whose root is not allowlisted ----
    push.ALLOWED_TX_SCRIPTS_SLOT[0..2]
    # => [slot_id_suffix, slot_id_prefix, pad(16)]

    exec.tx_script_allowlist::assert_tx_script_allowed
    # => [pad(16)]

    # ---- Reject any input note whose script root is not allowlisted ----
    push.ALLOWED_NOTE_SCRIPTS_SLOT[0..2]
    # => [slot_id_suffix, slot_id_prefix, pad(16)]

    exec.note_script_allowlist::assert_all_input_notes_allowed
    # => [pad(16)]

    # ---- Increment nonce iff the account state changed or the account is new ----
    exec.active_account::get_initial_commitment
    # => [INITIAL_COMMITMENT, pad(16)]

    exec.active_account::compute_commitment
    # => [CURRENT_COMMITMENT, INITIAL_COMMITMENT, pad(16)]

    exec.word::eq not
    # => [has_account_state_changed, pad(16)]

    exec.active_account::get_nonce eq.0
    # => [is_new_account, has_account_state_changed, pad(16)]

    or
    # => [should_increment_nonce, pad(16)]

    if.true
        exec.native_account::incr_nonce drop
    end
    # => [pad(16)]
end
`;

// ::miden::standards::components::auth::network_account::remove_allowed_note_script 0xb2a6e6e034c35baf49c915975b884d12698f97185635ce4090b43dfd89fded01
// ::miden::standards::components::auth::network_account::remove_allowed_tx_script 0xc1cc11b14268471327968fab4057f6dbdcc5a12e5cb25bbaddb29e2c5fbbc8dd
// ::miden::standards::components::auth::network_account::set_fee_policy 0xda991a79b56f74d322f9a11858d0dc4fd550e7f5cf79821730de3b4bbaf33f20

const authNetworkAccount: Script = {
  ...defaultScript(),
  id: "auth-network-account",
  name: "auth-network-account",
  type: "authentication-component",
  status: "compiled",
  readOnly: true,
  rust,
  masm,
  digest: "0x8eb432de0abf243f75991408423fae7faf86a1a4f43b9f0a805059d60303dd97",
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::add_allowed_fee_policy",
      digest:
        "0x13718a4dc7d1ffd9aa884aadf9a74ec0e1fab5159bebf6dda116df08dbcb9659",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::add_allowed_note_script",
      digest:
        "0x83cf2a01c8bd05d7e59084e7c16577dee77a99300ab4e7141fb67e5bc616b0cf",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::add_allowed_tx_script",
      digest:
        "0x9e92292aa78054398787a82718d71d2d163a9aa8a2d2fb7458792e2fc6255b2c",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::auth_network_transaction",
      digest:
        "0xceede7b3274e8bc0b703c940ff13c70f36e43154249761840be28e424f691dbd",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::estimate_note_fee",
      digest:
        "0xb0faa8a0f79c91c3d80399a3bc2298afa6dd7b570a634c09264ed8d196331d3c",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::get_fee_asset_id",
      digest:
        "0x30a59816a7ba87c39f16beea4b7a0bb5176db3e8e8bea190a90595e86db10b3e",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::get_fee_policy",
      digest:
        "0x0b83d739e3469f1a4b832a8d15c6b54acf8dc854507b8f00cf6667a54adbb29f",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::remove_allowed_fee_policy",
      digest:
        "0x19f5e03ef42650ffb776512497aa369541d39b11742eb3f18b6d43bb752a4e04",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::remove_allowed_note_script",
      digest:
        "0xb2a6e6e034c35baf49c915975b884d12698f97185635ce4090b43dfd89fded01",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::remove_allowed_tx_script",
      digest:
        "0xc1cc11b14268471327968fab4057f6dbdcc5a12e5cb25bbaddb29e2c5fbbc8dd",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::set_fee_policy",
      digest:
        "0xda991a79b56f74d322f9a11858d0dc4fd550e7f5cf79821730de3b4bbaf33f20",
    },
  ],
};

export default authNetworkAccount;
