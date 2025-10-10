import { type Script, defaultScript } from "@/lib/types/script";

export const basicAuthRust = `#![no_std]

#[global_allocator]
static ALLOC: miden::BumpAlloc = miden::BumpAlloc::new();

#[cfg(not(test))]
#[panic_handler]
fn my_panic(_info: &core::panic::PanicInfo) -> ! {
    loop {}
}

bindings::export!(AuthComponent with_types_in bindings);

mod bindings;

use bindings::exports::miden::base::authentication_component::Guest;
use miden::{
    account, component, felt,
    intrinsics::crypto::{merge, Digest},
    tx, Felt, Value, ValueAccess, Word,
};

/// Authentication component storage/layout.
///
/// Public key is expected to be in the slot 0. Matches MASM constant \`PUBLIC_KEY_SLOT=0\` in
/// ../base/crates/miden-lib/asm/account_components/rpo_falcon_512.masm
#[component]
struct AuthStorage {
    /// The account owner's public key (RPO-Falcon512 public key hash).
    #[storage(
        slot(0),
        description = "owner public key",
        type = "auth::rpo_falcon512::pub_key"
    )]
    owner_public_key: Value,
}

struct AuthComponent;

impl Guest for AuthComponent {
    fn auth_procedure(_arg: Word) {
        // Translated from MASM at:
        // https://github.com/0xMiden/miden-base/blob/280a53f8e7dcfa98fb88e6872e6972ec45c8ccc2/crates/miden-lib/asm/miden/contracts/auth/basic.masm?plain=1#L18-L57

        // Get commitments and account context
        let out_notes: Word = tx::get_output_notes_commitment();
        let in_notes: Word = tx::get_input_notes_commitment();
        let nonce: Felt = account::get_nonce();
        let acct_id = account::get_id();

        // Compute MESSAGE = h(OUT, h(IN, h([0,0,acc_id_prefix,acc_id_suffix], [0,0,0,nonce])))
        let w_id = Word::from([felt!(0), felt!(0), acct_id.prefix, acct_id.suffix]);
        let w_nonce = Word::from([felt!(0), felt!(0), felt!(0), nonce]);
        let inner = merge([Digest::from(w_id), Digest::from(w_nonce)]);
        let mid = merge([Digest::from(in_notes), inner]);
        let msg: Word = merge([Digest::from(out_notes), mid]).into();

        // Load public key from storage slot 0
        let storage = AuthStorage::default();
        let pub_key: Word = storage.owner_public_key.read();

        account::incr_nonce(felt!(1));

        // Emit signature request event to advice stack, then verify.
        miden::emit_falcon_sig_to_stack();
        miden::rpo_falcon512_verify(pub_key, msg);
    }
}
`;

export const basicAuthMasm = `use.miden::account
use.miden::tx
use.std::crypto::dsa::rpo_falcon512

# CONSTANTS
# =================================================================================================

# Event to place the falcon signature of a provided message and public key on the advice stack.
const.FALCON_SIG_TO_STACK=131087

# The slot in this component's storage layout where the public key is stored.
const.PUBLIC_KEY_SLOT=0

#! Authenticate a transaction using the Falcon signature scheme
#!
#! Inputs:  [pad(16)]
#! Outputs: [pad(16)]
export.auth__tx_rpo_falcon512
    # Get commitments to output notes
    exec.tx::get_output_notes_commitment
    # => [OUTPUT_NOTES_COMMITMENT, pad(16)]

    exec.tx::get_input_notes_commitment
    # => [INPUT_NOTES_COMMITMENT, OUTPUT_NOTES_COMMITMENT, pad(16)]

    # Get current nonce of the account and pad
    exec.account::get_nonce push.0.0.0
    # => [0, 0, 0, nonce, INPUT_NOTES_HASH, OUTPUT_NOTES_COMMITMENT, pad(16)]

    # Get current AccountID and pad
    exec.account::get_id push.0.0
    # => [0, 0, account_id_prefix, account_id_suffix,
    #     0, 0, 0, nonce,
    #     INPUT_NOTES_HASH,
    #     OUTPUT_NOTES_COMMITMENT,
    #     pad(16)]

    # Compute the message to be signed
    # MESSAGE = h(OUTPUT_NOTES_COMMITMENT, h(INPUT_NOTES_HASH, h(0, 0, account_id_prefix, account_id_suffix, 0, 0, 0, nonce)))
    hmerge hmerge hmerge
    # => [MESSAGE, pad(16)]

    # Get public key from account storage at pos 0 and verify signature
    push.PUBLIC_KEY_SLOT exec.account::get_item
    # => [PUB_KEY, MESSAGE, pad(16)]

    # Update the nonce
    push.1 exec.account::incr_nonce
    # => [PUB_KEY, MESSAGE, pad(16)]

    # Verify the signature against the public key and the message. The procedure gets as inputs the
    # hash of the public key and the hash of the message via the operand stack. The signature is
    # provided via the advice stack. The signature is valid if and only if the procedure returns.
    emit.FALCON_SIG_TO_STACK
    exec.rpo_falcon512::verify
    # => [pad(16)]
end
`;

const basicAuth: Script = {
  ...defaultScript(),
  id: "basic-auth",
  name: "Basic Auth",
  packageName: "basic-auth",
  type: "account",
  status: "compiled",
  readOnly: true,
  rust: basicAuthRust,
  masm: basicAuthMasm,
};

export default basicAuth;
