import { type Script, defaultScript, defaultExport } from "@/lib/types/script";

export const basicAuthRust = `#![no_std]

extern crate alloc;

use miden::{
    component, felt, hash_words, intrinsics::advice::adv_insert, native_account, tx, Felt, Value,
    ValueAccess, Word,
};

use crate::bindings::exports::miden::base::authentication_component::Guest;

miden::generate!();
bindings::export!(AuthComponent);

/// Authentication component storage/layout.
///
/// Public key is expected to be in the slot 0. Matches MASM constant \`PUBLIC_KEY_SLOT=0\` in
/// ../base/crates/miden-lib/asm/account_components/rpo_falcon_512.masm
#[component]
struct AuthComponent {
    /// The account owner's public key (RPO-Falcon512 public key hash).
    #[storage(
        slot(0),
        description = "owner public key",
        type = "auth::rpo_falcon512::pub_key"
    )]
    owner_public_key: Value,
}

impl Guest for AuthComponent {
    fn auth_procedure(_arg: Word) {
        let ref_block_num = tx::get_block_number();
        let final_nonce = native_account::incr_nonce();

        // Gather tx summary parts
        let acct_delta_commit = native_account::compute_delta_commitment();
        let input_notes_commit = tx::get_input_notes_commitment();
        let output_notes_commit = tx::get_output_notes_commitment();

        let salt = Word::from([felt!(0), felt!(0), ref_block_num, final_nonce]);

        let mut tx_summary = [acct_delta_commit, input_notes_commit, output_notes_commit, salt];
        let msg: Word = hash_words(&tx_summary).into();
        // On the advice stack the words are expected to be in the reverse order
        tx_summary.reverse();
        // Insert tx summary into advice map under key \`msg\`
        adv_insert(msg.clone(), &tx_summary);

        // Load public key from storage slot 0
        let storage = Self::default();
        let pub_key: Word = storage.owner_public_key.read();

        // Emit signature request event to advice stack,
        miden::emit_falcon_sig_to_stack(msg.clone(), pub_key.clone());

        // Verify the signature loaded on the advice stack.
        miden::rpo_falcon512_verify(pub_key, msg);
    }
}
`;

export const basicAuthMasm = `# The MASM code of the RPO Falcon 512 authentication Account Component.
#
# See the \`AuthRpoFalcon512\` Rust type's documentation for more details.

use miden::auth::rpo_falcon512
use miden::active_account

type BeWord = struct @bigendian { a: felt, b: felt, c: felt, d: felt }

# CONSTANTS
# =================================================================================================

# The slot in this component's storage layout where the public key is stored.
const PUBLIC_KEY_SLOT = 0

#! Authenticate a transaction using the Falcon signature scheme.
#!
#! It first increments the nonce of the account, independent of whether the account's state has
#! changed or not. Then it computes and signs the following message (in memory order):
#! [ACCOUNT_DELTA_COMMITMENT, INPUT_NOTES_COMMITMENT,
#!  OUTPUT_NOTES_COMMITMENT, [0, 0, ref_block_num, final_nonce]]
#!
#! Including the final_nonce is necessary for replay protection. The reference block number is
#! included to commit to the transaction creator's intended reference block of the transaction
#! which determines the fee parameters and therefore the fee amount that is deducted.
#!
#! Inputs:  [AUTH_ARGS, pad(12)]
#! Outputs: [pad(16)]
#!
#! Invocation: call
pub proc auth_tx_rpo_falcon512(auth_args: BeWord)
    dropw
    # => [pad(16)]

    # Fetch public key from storage.
    # ---------------------------------------------------------------------------------------------
    push.PUBLIC_KEY_SLOT exec.active_account::get_item
    # => [PUB_KEY, pad(16)]

    exec.rpo_falcon512::authenticate_transaction
    # => [pad(16)]
end
`;

const basicAuth: Script = {
  ...defaultScript(),
  id: "basic-auth",
  name: "basic-auth",
  type: "authentication-component",
  status: "compiled",
  readOnly: true,
  rust: basicAuthRust,
  masm: basicAuthMasm,
  exports: [
    {
      ...defaultExport(),
      name: "auth_tx_rpo_falcon512",
      digest:
        "0x97271c437f9715b37fe022de0283a093a3f89f5dbc918970c93c5ab398b863d3",
    },
  ],
};

export default basicAuth;
