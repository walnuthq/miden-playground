import {
  type Script,
  defaultProcedureExport,
  defaultScript,
} from "@/lib/types/script";

export const psmRust = ``;

export const psmMasm = `# Private State Manager (PSM) Authentication Component
#
# This component provides PSM signature verification for accounts.
# It can be used standalone or in conjunction with other auth components like multisig.

use miden::protocol::active_account
use miden::protocol::native_account

type BeWord = struct @bigendian { a: felt, b: felt, c: felt, d: felt }

# IMPORTANT SECURITY NOTES
# --------------------------------------------------------------------------------
# - The selector in \`PSM_SELECTOR_SLOT\` controls whether the extra PSM signature
#   is enforced:
#     * PSM_ON  => exactly one valid PSM signature is required.
#     * PSM_OFF => PSM signature is skipped for that call.
#
# - \`verify_psm_signature\` reads the selector from initial storage state.
#   This means changes made during the same transaction won't affect the check.
#
# - \`enable_psm\` / \`disable_psm\` procedures allow explicit control over PSM state.
#
# - \`update_psm_public_key\`:
#     * Installs a new PSM public key in the map at \`PSM_PUBLIC_KEY_MAP_SLOT\`.
#     * Does not itself perform any signature checks.
#     * To update the key without requiring PSM signature, ensure selector is OFF.
#
# Storage Layout
# --------------------------------------------------------------------------------
#
# +---------------------+---------------+
# |     DESCRIPTION     |     SLOT      |
# +---------------------+---------------+
# | PSM SELECTOR (word) |       0       |
# | PSM PUBLIC KEY MAP  |       1       |
# +---------------------+---------------+
#
# - PSM_SELECTOR_SLOT (0):
#     * Stores a word that is compared against [1, 0, 0, 0] (PSM_ON).
#     * Any value != PSM_ON is treated as PSM_OFF.
#
# - PSM_PUBLIC_KEY_MAP_SLOT (1):
#     * A map from a fixed key [0, 0, 0, 0] to the single PSM public key:
#         [0, 0, 0, 0] => PSM_PUBLIC_KEY
#     * PSM_PUBLIC_KEY is a RPO Falcon 512 public key represented as a word.

# CONSTANTS
# =================================================================================================

# Slot where the PSM selector flag is stored (using word() for named slot access):
# - PSM_ON  => PSM signature required
# - PSM_OFF => PSM signature skipped
const PSM_SELECTOR_SLOT=word("openzeppelin::psm::selector")

# Map slot for PSM public key
# Uses exactly one PSM public key at index [0, 0, 0, 0]
# [0, 0, 0, 0] => PSM_PUBLIC_KEY
const PSM_PUBLIC_KEY_MAP_SLOT=word("openzeppelin::psm::public_key")

# Selector flag values
const PSM_ON=[1, 0, 0, 0]
const PSM_OFF=[0, 0, 0, 0]

# The event emitted when a signature is not found for a required signer.
const AUTH_UNAUTHORIZED_EVENT=event("miden::auth::unauthorized")

# PSM PROCEDURES
# =================================================================================================

#! Enable PSM verification by setting the selector to ON.
#!
#! Operand stack inputs: []
#! Outputs: []
#!
#! Notes:
#! - Sets PSM_SELECTOR_SLOT to PSM_ON (1)
#! - After this, transactions will require PSM signature verification
proc enable_psm
    push.PSM_ON
    # => [PSM_ON]

    push.PSM_SELECTOR_SLOT[0..2]
    # => [selector_slot_prefix, selector_slot_suffix, PSM_ON]

    exec.native_account::set_item
    # => [OLD_ROOT]

    dropw
    # => []
end

#! Disable PSM verification by setting the selector to OFF.
#!
#! Operand stack inputs: []
#! Outputs: []
#!
#! Notes:
#! - Sets PSM_SELECTOR_SLOT to PSM_OFF (0)
#! - After this, transactions will NOT require PSM signature verification
proc disable_psm
    push.PSM_OFF
    # => [PSM_OFF]

    push.PSM_SELECTOR_SLOT[0..2]
    # => [selector_slot_prefix, selector_slot_suffix, PSM_OFF]

    exec.native_account::set_item
    # => [OLD_ROOT]

    dropw
    # => []
end

#! Update the PSM public key.
#!
#! Operand stack inputs: []
#! Advice stack inputs:  [PUB_KEY]
#!   - PUB_KEY is the new PSM RPO Falcon 512 public key
#!
#! Notes:
#! - Stores PUB_KEY into PSM_PUBLIC_KEY_MAP_SLOT:
#!      [0, 0, 0, 0] => PSM_PUBLIC_KEY
#! - To update the key without requiring PSM signature, ensure
#!   PSM_SELECTOR_SLOT = 0 (OFF) before calling this.
pub proc update_psm_public_key
    exec.disable_psm
    # ------ Update the PSM public key ------
    adv_loadw
    # => [PUB_KEY]

    push.0.0.0.0
    # => [MAP_KEY, PUB_KEY]
    # Note that MAP_KEY is [0, 0, 0, 0] for a single PSM_KEY

    push.PSM_PUBLIC_KEY_MAP_SLOT[0..2]
    # => [pub_key_slot_prefix, pub_key_slot_suffix, MAP_KEY, PUB_KEY]

    exec.native_account::set_map_item
    # => [OLD_MAP_VALUE]

    dropw
    # => []
end

#! Conditionally verify a "PSM" signature against a stored public key hash.
#! The condition is controlled by the selector at PSM_SELECTOR_SLOT.
#!
#! Inputs:  [MSG]
#! Outputs: [MSG]
#!
#! Panics if:
#! - Selector is ON but the provided PSM signature is invalid or missing.
#!
#! Notes:
#! - MSG is TX_SUMMARY_COMMITMENT provided by auth procedure
#! - If selector is OFF (0), PSM verification is skipped
#! - Selector value is read from initial storage state
pub proc verify_psm_signature(msg: BeWord) -> BeWord
    push.PSM_SELECTOR_SLOT[0..2]
    exec.active_account::get_item
    drop drop drop
    # => [selector, MSG]

    push.1 eq
    if.true
        push.1
        push.PSM_PUBLIC_KEY_MAP_SLOT[0..2]
        exec.::miden::standards::auth::falcon512_rpo::verify_signatures
        push.1 neq
        if.true
            emit.AUTH_UNAUTHORIZED_EVENT
            push.0 assert.err="invalid PSM signature"
        end
    end
    # => [MSG]
    exec.enable_psm
end
`;

const psm: Script = {
  ...defaultScript(),
  id: "psm",
  name: "psm",
  type: "account",
  status: "compiled",
  readOnly: true,
  rust: psmRust,
  masm: psmMasm,
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "update_psm_public_key",
      digest:
        "0x35498ce6e3bc24ae0e0094dc54a09b8b2bbcbc28607f86ba25684cd4a2d8f55b",
    },
    {
      ...defaultProcedureExport(),
      path: "verify_psm_signature",
      digest:
        "0x2f1b90e9d89f1a541dd8621444edba9d3e0a66ef54147ebf59bf964969b9dfd1",
      signature: {
        abi: 0,
        params: ["Word"],
        results: ["Word"],
      },
    },
  ],
};

export default psm;
