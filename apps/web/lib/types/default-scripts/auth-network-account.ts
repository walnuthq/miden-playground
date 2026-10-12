import type { Script } from "@/lib/types/script";
import { defaultProcedureExport, defaultScript } from "@/lib/utils/script";

export const rust = ``;

export const masm = `# The MASM code of the AuthNetworkAccount authentication component.
#
# See the \`AuthNetworkAccount\` Rust type's documentation for more details.

use miden::protocol::active_account
use miden::protocol::native_account
use miden::protocol::tx
use miden::core::word
use miden::standards::assets::fungible_asset
use miden::standards::auth::network_account
use miden::standards::fee
use miden::standards::fees
use miden::standards::fees::fee_manager

pub use {add_allowed_note_script} from miden::standards::auth::network_account
pub use {remove_allowed_note_script} from miden::standards::auth::network_account
pub use {add_allowed_tx_script} from miden::standards::auth::network_account
pub use {remove_allowed_tx_script} from miden::standards::auth::network_account

pub use {estimate_note_fee} from miden::standards::fees::fee_manager
pub use {get_fee_asset_id} from miden::standards::fees::fee_manager
pub use {get_fee_policy} from miden::standards::fees::fee_manager
pub use {set_fee_policy} from miden::standards::fees::fee_manager
pub use {add_allowed_fee_policy} from miden::standards::fees::fee_manager
pub use {remove_allowed_fee_policy} from miden::standards::fees::fee_manager

# Estimated upper bound on the number of cycles this auth procedure spends after pay_fee
# returns: the sponsorship conservation check, the account commitment comparison and the nonce
# increment.
const NETWORK_POST_FEE_CYCLES = 1024

# ERRORS
# =================================================================================================

const ERR_NETWORK_ACCOUNT_FEE_ASSET_NOT_NATIVE = "sponsoring at most the collected fees requires the account's fee asset to be the native fee asset"

const ERR_NETWORK_ACCOUNT_TRANSACTION_HAS_NO_EFFECT = "network account transactions must have an effect before fee payment by consuming an input note, creating an output note, or changing account state"

const ERR_NETWORK_ACCOUNT_SPONSORED_FEES_EXCEED_COLLECTED = "the fees moved into sponsorship notes exceed the fees collected in this transaction"

# HELPER PROCEDURES
# =================================================================================================

#! Asserts that the transaction had an effect before fee collection and payment.
#!
#! Consuming an input note, creating an output note, or changing the account state counts as an
#! effect. Transaction metadata changes do not affect the account commitment and do not count.
#!
#! This intentionally differs from the transaction epilogue's post-authentication non-empty check.
#! The input notes commitment is checked in the same way, but the account's current commitment is
#! compared with its initial commitment because its delta cannot be computed before the auth
#! procedure increments the nonce. Output notes also count here because this auth procedure may
#! sponsor them and change the account state after this pre-fee check.
#!
#! Inputs:  []
#! Outputs: []
#!
#! Invocation: exec
proc assert_tx_has_effect()
    exec.tx::get_input_notes_commitment
    # => [INPUT_NOTES_COMMITMENT, pad(16)]

    exec.word::eqz not
    # => [has_input_notes, pad(16)]

    exec.tx::get_num_output_notes neq.0
    # => [has_output_notes, has_input_notes, pad(16)]

    or
    # => [has_note_effect, pad(16)]

    exec.native_account::has_state_changed
    # => [has_account_state_changed, has_note_effect, pad(16)]

    or
    # => [has_effect, pad(16)]

    assert.err=ERR_NETWORK_ACCOUNT_TRANSACTION_HAS_NO_EFFECT
    # => [pad(16)]
end

# AUTH PROCEDURE
# =================================================================================================

#! Authenticates a transaction against an \`AuthNetworkAccount\` component.
#!
#! Enforces three invariants:
#! 1. The transaction script root, if any, must be present in the tx-script allowlist (a transaction
#!    that executed no tx script is always allowed).
#! 2. Every consumed input note must have a script root present in the note-script allowlist.
#! 3. Before fee collection and payment, the transaction must have consumed at least one input note,
#!    created at least one output note, or changed the account state.
#!
#! If these checks pass, the fees prepaid by any FEE_SPONSORSHIP input notes are collected into the
#! account's vault (see fees::collect_sponsored_fees). This requires the account to have an active
#! fee policy and to allowlist the FEE_SPONSORSHIP script root so the sponsorship notes pass the
#! input-note check above.
#!
#! The transaction fee is then paid by creating a public TX_FEE note funded from the account's
#! vault in the native fee asset at rate 1/1 (see fee::pay_fee and fee::native_conversion_info). On
#! chains with a zero verification base fee no note is created. Paying the fee also sponsors every
#! network output note of the transaction out of the account's vault.
#!
#! If the account's \`sponsor_at_most_collected_fees\` setting is enabled, what was sponsored must not
#! exceed what was collected: the account then never subsidises a downstream consumer out of its own
#! funds (see network_account::get_sponsor_at_most_collected_fees).
#!
#! Finally, the nonce is incremented when the account state changed or the account is new,
#! matching the behavior of the NoAuth and SingleSig components. Note that on fee-charging
#! chains the fee payment itself withdraws from the vault, so the account state always changes
#! and the nonce always increments.
#!
#! Inputs:  [AUTH_ARGS, pad(12)]
#! Outputs: [pad(16)]
#!
#! Panics if:
#! - the transaction script root or a consumed input note's script root is not allowlisted.
#! - before fee collection and payment, the transaction has not consumed an input note, created an
#!   output note, or changed the account state.
#! - the sponsorship setting is enabled, the transaction sponsored something and the configured fee
#!   asset is not the native fee asset, which would make the two amounts incomparable.
#! - the sponsorship setting is enabled and the sponsored fees exceed the collected fees.
#!
#! Invocation: call
@auth_script
pub proc auth_network_transaction(auth_args: word)
    dropw
    # => [pad(16)]

    exec.network_account::assert_transaction_allowed
    # => [pad(16)]

    # ---- Reject transactions whose only account effect would be fee payment ----
    exec.assert_tx_has_effect
    # => [pad(16)]

    # ---- Read the sponsorship policy ----
    # read before the fee is computed to keep its cost inside the region compute_fee measures.
    # negate the setting to make the assertions clearer.
    exec.network_account::get_sponsor_at_most_collected_fees not
    # => [sponsor_unlimited, pad(16)]

    # ---- Read the conversion info of the native fee asset ----
    exec.fee::native_conversion_info
    # => [CONVERSION_INFO, sponsor_unlimited, pad(16)]

    # ---- Collect fees from sponsorship input notes into the account's vault ----
    # done before paying the fee so the collected assets can fund the fee payment.
    # collect fees in the asset the fee manager is configured with.
    exec.fee_manager::read_fee_asset_id
    # => [FEE_ASSET_ID, CONVERSION_INFO, sponsor_unlimited, pad(16)]

    # collected fees are denominated in the configured fee asset while sponsorship notes are funded
    # in the native one, so the two amounts are only comparable when they are the same asset.
    dupw dup.9 dup.9 exec.fungible_asset::create_id exec.word::eq
    # => [is_fee_asset_id_match, FEE_ASSET_ID, CONVERSION_INFO, sponsor_unlimited, pad(16)]

    movdn.4 exec.fees::collect_sponsored_fees
    # => [collected_fee_amount, is_fee_asset_id_match, CONVERSION_INFO, sponsor_unlimited, pad(16)]

    # ---- Pay the transaction fee in the native fee asset ----
    movdn.5 movdn.5
    # => [CONVERSION_INFO, collected_fee_amount, is_fee_asset_id_match, sponsor_unlimited, pad(16)]

    push.NETWORK_POST_FEE_CYCLES
    # => [num_extra_cycles, CONVERSION_INFO, collected_fee_amount, is_fee_asset_id_match,
    #     sponsor_unlimited, pad(16)]

    exec.tx::get_reference_block_number movdn.5
    # => [num_extra_cycles, CONVERSION_INFO, serial_number_block, collected_fee_amount,
    #     is_fee_asset_id_match, sponsor_unlimited, pad(16)]

    exec.fee::pay_fee
    # => [sponsored_fee_amount, collected_fee_amount, is_fee_asset_id_match, sponsor_unlimited, pad(16)]

    # ---- Reject sponsoring more than was collected when the setting is enabled ----
    dup eq.0
    # => [has_sponsored_zero, sponsored_fee_amount, collected_fee_amount, is_fee_asset_id_match,
    #     sponsor_unlimited, pad(16)]

    # txs that sponsor 0 or unlimited don't require an asset ID match
    # assert sponsor_unlimited || has_sponsored_zero || is_fee_asset_id_match
    dup.4 or movup.3 or assert.err=ERR_NETWORK_ACCOUNT_FEE_ASSET_NOT_NATIVE
    # => [sponsored_fee_amount, collected_fee_amount, sponsor_unlimited, pad(16)]

    # assert collected >= sponsored || sponsor_unlimited
    gte or assert.err=ERR_NETWORK_ACCOUNT_SPONSORED_FEES_EXCEED_COLLECTED
    # => [pad(16)]

    # ---- Increment nonce iff the account state changed or the account is new ----
    exec.native_account::has_state_changed
    # => [has_account_state_changed, pad(16)]

    # has_state_changed verifies that the active account is the native account, so reading the
    # active account nonce here identifies whether that native account is new.
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
