import type { Script } from "@/lib/types/script";
import { defaultProcedureExport, defaultScript } from "@/lib/utils/script";

export const rust = `#![no_std]
#![feature(alloc_error_handler)]

extern crate alloc;

use miden::{
    component, component_storage, felt, hash_words, intrinsics::advice::adv_insert, tx,
    StorageValue, Word,
};

/// Authentication component storage/layout.
///
/// Public key is expected to be in the slot 0. Matches MASM constant \`PUBLIC_KEY_SLOT=0\` in
/// ../base/crates/miden-lib/asm/account_components/rpo_falcon_512.masm
#[component_storage]
struct AuthComponentStorage {
    /// The account owner's public key (RPO-Falcon512 public key hash).
    #[storage(
        description = "owner public key",
        type = "miden::standards::auth::pub_key"
    )]
    owner_public_key: StorageValue<Word>,
}

/// API of the RPO-Falcon512 authentication component.
#[component]
trait AuthComponent {
    #[auth_script]
    fn check_signature(&mut self, _arg: Word);
}

#[component]
impl AuthComponent for AuthComponentStorage {
    fn check_signature(&mut self, _arg: Word) {
        let ref_block_num = tx::get_block_number();
        let final_nonce = self.incr_nonce();

        // Gather tx summary parts
        let acct_delta_commit = self.compute_delta_commitment();
        let input_notes_commit = tx::get_input_notes_commitment();
        let output_notes_commit = tx::get_output_notes_commitment();

        let salt = Word::from([felt!(0), felt!(0), ref_block_num.into(), final_nonce.into()]);

        let tx_summary = [
            acct_delta_commit,
            input_notes_commit,
            output_notes_commit,
            salt,
        ];
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
use miden::standards::fee
use miden::protocol::native_account
use miden::protocol::tx

# CONSTANTS
# =================================================================================================

# The slot in this component's storage layout where the public key commitment is stored.
const PUBLIC_KEY_COMMITMENT_SLOT = word("miden::standards::auth::singlesig::pub_key")

# The slot in this component's storage layout where the corresponding signature scheme id is stored.
const SCHEME_ID_SLOT = word("miden::standards::auth::singlesig::scheme")

#! Authenticate a transaction using the signature scheme specified by scheme_id, paying the
#! transaction fee in the process.
#!
#! Supported schemes:
#! - 1 => ecdsa_k256_keccak
#! - 2 => falcon512_poseidon2
#!
#! It first decodes the fee conversion info committed to by the AUTH_ARGS (see
#! miden::standards::fee::load_conversion_info) and pays the transaction fee by creating and
#! funding a public TX_FEE note (see miden::standards::fee::pay_fee). The conversion info
#! committed via the AUTH_ARGS must name the reference block's fee asset at rate 1/1. On chains
#! with a zero verification base fee no note is created.
#! Because the fee is paid before the transaction summary is created, the fee note and the vault
#! withdrawal funding it are covered by the signature.
#!
#! It then increments the nonce of the account, independent of whether the account's state has
#! changed or not, and computes and signs the following message (in memory order):
#! [ACCOUNT_DELTA_COMMITMENT, INPUT_NOTES_COMMITMENT, OUTPUT_NOTES_COMMITMENT,
#!  BLOCK_COMMITMENT, [expiration_delta, final_nonce, 0, 0], [0, 0, 0, 0]]
#!
#! Including the final_nonce is necessary for replay protection. The reference block commitment is
#! included to commit to the transaction creator's intended reference block of the transaction
#! which determines the fee parameters and therefore the fee amount that is deducted. The
#! expiration block delta is included to commit to the transaction's expiration.
#!
#! Inputs:  [AUTH_ARGS, pad(12)]
#! Outputs: [pad(16)]
#!
#! Invocation: call
@auth_script
pub proc auth_tx(auth_args: word)
    # Decode the fee conversion info committed to by the auth args.
    # ---------------------------------------------------------------------------------------------

    exec.fee::load_conversion_info
    # => [CONVERSION_INFO, pad(12)]

    # Fetch the signature scheme id from storage.
    # ---------------------------------------------------------------------------------------------

    push.SCHEME_ID_SLOT[0..2] exec.native_account::get_initial_item
    # => [scheme_id, 0, 0, 0, CONVERSION_INFO, pad(12)]

    movdn.3 drop drop drop
    # => [scheme_id, CONVERSION_INFO, pad(12)]

    # Pay the transaction fee before the summary is created so that the TX_FEE note and the
    # vault withdrawal funding it are covered by the signed transaction summary.
    # ---------------------------------------------------------------------------------------------

    dup exec.signature::estimate_authentication_cycles
    # => [num_extra_cycles, scheme_id, CONVERSION_INFO, pad(12)]

    swap movdn.5
    # => [num_extra_cycles, CONVERSION_INFO, scheme_id, pad(12)]

    exec.tx::get_reference_block_number movdn.5
    # => [num_extra_cycles, CONVERSION_INFO, serial_number_block, scheme_id, pad(12)]

    exec.fee::pay_fee drop
    # => [scheme_id, pad(12)]

    # Fetch public key commitment from storage.
    # ---------------------------------------------------------------------------------------------

    push.PUBLIC_KEY_COMMITMENT_SLOT[0..2] exec.native_account::get_initial_item
    # => [PK_COMM, scheme_id, pad(12)]

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
  commitment:
    "0xca556e3d56ba394901cc8809b68c082b3388f77d17fc92c628501fc3f3d972b1",
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::singlesig::auth_tx",
      digest:
        "0xef78e050e8a0086115519fc1440ef6f26d94b63292a4d55f0aa1cd3451777565",
    },
  ],
};

export default authSingleSig;
