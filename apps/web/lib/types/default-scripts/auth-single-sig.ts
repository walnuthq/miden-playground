import type { Script } from "@/lib/types/script";
import { defaultProcedureExport, defaultScript } from "@/lib/utils/script";

export const rust = `#![no_std]
#![feature(alloc_error_handler)]

extern crate alloc;

use miden::{StorageValue, Word, component, felt, hash_words, intrinsics::advice::adv_insert, tx};

/// Authentication component storage/layout.
///
/// Public key is expected to be in the slot 0. Matches MASM constant \`PUBLIC_KEY_SLOT=0\` in
/// ../base/crates/miden-lib/asm/account_components/rpo_falcon_512.masm
#[component]
struct AuthComponent {
    /// The account owner's public key (RPO-Falcon512 public key hash).
    #[storage(
        description = "owner public key",
        type = "miden::standards::auth::pub_key"
    )]
    owner_public_key: StorageValue<Word>,
}

#[component]
impl AuthComponent {
    #[auth_script]
    pub fn check_signature(&mut self, _arg: Word) {
        let ref_block_num = tx::get_block_number();
        let final_nonce = self.incr_nonce();

        // Gather tx summary parts
        let acct_delta_commit = self.compute_delta_commitment();
        let input_notes_commit = tx::get_input_notes_commitment();
        let output_notes_commit = tx::get_output_notes_commitment();

        let salt = Word::from([felt!(0), felt!(0), ref_block_num, final_nonce]);

        let tx_summary = [acct_delta_commit, input_notes_commit, output_notes_commit, salt];
        let msg: Word = hash_words(&tx_summary).into();
        // Insert tx summary into advice map under key \`msg\`
        adv_insert(msg, &tx_summary);

        let pub_key: Word = self.owner_public_key.get();

        // Emit signature request event to advice stack,
        miden::emit_falcon_sig_to_stack(msg, pub_key);

        // Verify the signature loaded on the advice stack.
        miden::rpo_falcon512_verify(pub_key, msg);
    }
}
`;

export const masm = `# The MASM code of the BasicSignature Authentication Account Component.
#
# See the \`AuthBasicSignature\` Rust type's documentation for more details.

use miden::standards::auth::signature
use miden::protocol::active_account

# CONSTANTS
# =================================================================================================

# The slot in this component's storage layout where the public key is stored.
const PUBLIC_KEY_SLOT = word("miden::standards::auth::singlesig::pub_key")

# The slot in this component's storage layout where the corresponding signature scheme id is stored.
const SCHEME_ID_SLOT = word("miden::standards::auth::singlesig::scheme")

#! Authenticate a transaction using the signature scheme specified by scheme_id.
#!
#! Supported schemes:
#! - 1 => ecdsa_k256_keccak
#! - 2 => falcon512_poseidon2
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
@auth_script
pub proc auth_tx(auth_args: word)
    dropw
    # => [pad(16)]

    # Fetch public key from storage.
    # ---------------------------------------------------------------------------------------------

    push.PUBLIC_KEY_SLOT[0..2] exec.active_account::get_item
    # => [PUB_KEY, pad(16)]

    push.SCHEME_ID_SLOT[0..2] exec.active_account::get_item
    # => [scheme_id, 0, 0, 0, PUB_KEY, pad(16)]

    movdn.7 drop drop drop
    # => [PUB_KEY, scheme_id, pad(16)]

    exec.signature::authenticate_transaction
    # => [pad(16)]
end
`;

const authSingleSig: Script = {
  ...defaultScript(),
  id: "auth-single-sig",
  name: "auth-single-sig",
  type: "authentication-component",
  status: "compiled",
  readOnly: true,
  rust,
  masm,
  digest: "0x8e3520920017c0332f216fc5cc2ccdcff81f9d4fce2892de2dfad67a71092898",
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::singlesig::auth_tx",
      digest:
        "0x92da8dad708417474b787887cc149837b1f960d9888080bf60f532c2a8f66a19",
    },
  ],
};

export default authSingleSig;
