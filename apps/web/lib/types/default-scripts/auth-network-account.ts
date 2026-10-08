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

// ::miden::standards::components::auth::network_account::remove_allowed_note_script 0x4eb2d9d45eecc465df64e0304ef444ab981e38879ef0c4ce1ede26cab51e6a28
// ::miden::standards::components::auth::network_account::remove_allowed_tx_script 0x8046ec8b5ff29824b0f92f6f81f5be7dd3eae1d202abfec986f4079dda08fa97
// ::miden::standards::components::auth::network_account::set_fee_policy 0x98e8e9f54acfde7a1d84f584f3c5c9715f51faa5656ca708b04f2c7de4d08dfd

const authNetworkAccount: Script = {
  ...defaultScript(),
  id: "auth-network-account",
  name: "auth-network-account",
  type: "authentication-component",
  status: "compiled",
  readOnly: true,
  rust,
  masm,
  commitment:
    "0xd16c8eedd5e0c8cc784bb329a89bc952e7616529feca6f67a99c5fb76b6b1a00",
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::add_allowed_fee_policy",
      digest:
        "0x3b1607a335b51fd9ca43c5b648b60d4d56422a0f810dcc12c05bdfeeb0154903",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::add_allowed_note_script",
      digest:
        "0xb843606074a400db58322a0fb7264e0a3e5f8a70ea1d2a9fa1426b2289379023",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::add_allowed_tx_script",
      digest:
        "0x09f5a3eafd56d83922d7764e7224b0a65d153e100321e37b3e2ec7b5890ffb9a",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::auth_network_transaction",
      digest:
        "0xb369ccc84b76ddf55e73b158f3e4ef26e0fa62441f540284ca0dcd160063ed94",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::estimate_note_fee",
      digest:
        "0xff38b2698842ef9f718d62ec1f5b56eb97081717a47987777316159b150a5d44",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::get_fee_asset_id",
      digest:
        "0x30a1d60fb7039cfd548ccd6e5483a7210e2cced5db3a8d807c7cd263ec6bab5e",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::get_fee_policy",
      digest:
        "0x32b9d2f5d10512438d93724b03524f6bc778a84e09b68abd343b7d3a028e9631",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::remove_allowed_fee_policy",
      digest:
        "0x249970534969a306ef71563a7de90daffa3cbdfeae12561884e95049f4581868",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::remove_allowed_note_script",
      digest:
        "0x4eb2d9d45eecc465df64e0304ef444ab981e38879ef0c4ce1ede26cab51e6a28",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::remove_allowed_tx_script",
      digest:
        "0x8046ec8b5ff29824b0f92f6f81f5be7dd3eae1d202abfec986f4079dda08fa97",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::network_account::set_fee_policy",
      digest:
        "0x98e8e9f54acfde7a1d84f584f3c5c9715f51faa5656ca708b04f2c7de4d08dfd",
    },
  ],
};

export default authNetworkAccount;
