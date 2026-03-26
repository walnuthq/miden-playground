import {
  type Script,
  defaultProcedureExport,
  defaultScript,
} from "@/lib/types/script";

export const rust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
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

export const masm = `use miden::protocol::active_account
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

const authNoAuth: Script = {
  ...defaultScript(),
  id: "auth-no-auth",
  name: "auth-no-auth",
  type: "authentication-component",
  status: "compiled",
  readOnly: true,
  rust,
  masm,
  digest: "0xe9ee054ffeb3bd22bc4f0a4778960ec8e3571b0a0c8299bfed0cdb5d156686b7",
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "::no_auth::auth_no_auth",
      digest:
        "0x00498108f0eae0e35deadd489892062338c3d55772635d0b133f0bdf2980bf64",
    },
  ],
};

export default authNoAuth;
