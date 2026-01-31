import { type Script, defaultExport, defaultScript } from "@/lib/types/script";
import { NO_AUTH_PROC_HASH } from "@/lib/constants";

export const noAuthRust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]
#![feature(alloc_error_handler)]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
//
// extern crate alloc;
// use alloc::vec::Vec;

use miden::{component, Word};

#[component]
struct AuthComponent;

#[component]
impl AuthComponent {
    pub fn auth_procedure(&mut self, _arg: Word) {
        // translated from MASM at
        // https://github.com/0xMiden/miden-base/blob/e4912663276ab8eebb24b84d318417cb4ea0bba3/crates/miden-lib/asm/account_components/no_auth.masm?plain=1
        let init_comm = self.get_initial_commitment();
        let curr_comm = self.compute_commitment();
        // check if the account state has changed by comparing initial and final commitments
        if curr_comm != init_comm {
            // if the account has been updated, increment the nonce
            self.incr_nonce();
        }
    }
}
`;

export const noAuthMasm = `use miden::protocol::active_account
use miden::protocol::native_account
use miden::core::word

#! Increment the nonce only if the account commitment has changed
#!
#! This authentication procedure provides minimal authentication by checking if the account
#! state has actually changed during transaction execution. It compares the initial account
#! commitment with the current commitment and only increments the nonce if they differ.
#! This avoids unnecessary nonce increments for transactions that don't modify
#! the account state.
#!
#! Inputs:  [pad(16)]
#! Outputs: [pad(16)]
pub proc auth_no_auth
    # check if the account state has changed by comparing initial and final commitments

    exec.active_account::get_initial_commitment
    # => [INITIAL_COMMITMENT, pad(16)]

    exec.active_account::compute_commitment
    # => [CURRENT_COMMITMENT, INITIAL_COMMITMENT, pad(16)]

    exec.word::eq not
    # => [has_account_state_changed, pad(16)]

    # check if this is a new account (i.e., nonce == 0); this check is needed because new
    # accounts are initialized with a non-empty state, and thus, unless the account was modified
    # during the transaction, the initial and current state commitments will be the same

    exec.active_account::get_nonce eq.0
    # => [is_new_account, has_account_state_changed, pad(16)]

    or
    # => [should_increment_nonce, pad(16)]

    # if the account has been updated or we are creating a new account, increment the nonce
    if.true
        exec.native_account::incr_nonce drop
    end
end
`;

const noAuth: Script = {
  ...defaultScript(),
  id: "no-auth",
  name: "no-auth",
  type: "authentication-component",
  status: "compiled",
  readOnly: true,
  rust: noAuthRust,
  masm: noAuthMasm,
  exports: [
    {
      ...defaultExport(),
      name: "auth_no_auth",
      digest: NO_AUTH_PROC_HASH,
    },
  ],
};

export default noAuth;
