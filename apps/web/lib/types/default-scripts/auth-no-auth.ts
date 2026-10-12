import type { Script } from "@/lib/types/script";
import { defaultProcedureExport, defaultScript } from "@/lib/utils/script";

export const rust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]
#![feature(alloc_error_handler)]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
//
// extern crate alloc;
// use alloc::vec::Vec;

use miden::{component, component_storage, Word};

#[component_storage]
struct AuthComponentStorage;

/// API of the no-auth authentication component.
#[component]
trait AuthComponent {
    #[auth_script]
    fn auth_procedure(&mut self, _arg: Word);
}

#[component]
impl AuthComponent for AuthComponentStorage {
    fn auth_procedure(&mut self, _arg: Word) {
        // translated from MASM at
        // https://github.com/0xMiden/miden-base/blob/e4912663276ab8eebb24b84d318417cb4ea0bba3/crates/miden-lib/asm/account_components/no_auth.masm?plain=1
        let init_comm = miden::native_account::get_initial_commitment();
        let curr_comm = self.compute_commitment();
        // check if the account state has changed by comparing initial and final commitments
        if curr_comm != init_comm {
            // if the account has been updated, increment the nonce
            self.incr_nonce();
        }
    }
}
`;

export const masm = `use {AuthArgs} from miden::standards::types
use miden::protocol::active_account
use miden::protocol::native_account
use miden::protocol::tx
use miden::standards::fee

# CONSTANTS
# =================================================================================================

# Estimated upper bound on the number of cycles this auth procedure spends after pay_fee
# returns: the account commitment comparison and the nonce increment.
const NO_AUTH_POST_FEE_CYCLES = 1024

# AUTH PROCEDURE
# =================================================================================================

#! Pay the transaction fee and increment the nonce only if the account commitment has changed
#!
#! This authentication procedure provides minimal authentication by checking if the account
#! state has actually changed during transaction execution. It compares the initial account
#! commitment with the current commitment and only increments the nonce if they differ.
#! This avoids unnecessary nonce increments for transactions that don't modify
#! the account state.
#!
#! The transaction fee is paid by creating a public TX_FEE note funded from the account's
#! vault in the native fee asset at rate 1/1 (see fee::pay_fee and fee::native_conversion_info).
#! On chains with a zero verification base fee no note is created.
#!
#! Inputs:  [AUTH_ARGS, pad(12)]
#! Outputs: [pad(16)]
#!
#! Invocation: call
@auth_script
pub proc auth_no_auth(auth_args: AuthArgs)
    dropw
    # => [pad(16)]

    # ---- Pay the transaction fee in the native fee asset ----
    exec.fee::native_conversion_info
    # => [CONVERSION_INFO, pad(16)]

    push.NO_AUTH_POST_FEE_CYCLES
    # => [num_extra_cycles, CONVERSION_INFO, pad(16)]

    exec.tx::get_reference_block_number movdn.5
    # => [num_extra_cycles, CONVERSION_INFO, serial_number_block, pad(16)]

    exec.fee::pay_fee drop
    # => [pad(16)]

    # check if the account state has changed
    exec.native_account::has_state_changed
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
  commitment:
    "0xdf9079c0a5668001295dfa427f4c03a61c6fa4cb92c0c2b7293b30a622cb2982",
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::no_auth::auth_no_auth",
      digest:
        "0xe5afacc0738b7dac12381596e1d8f59fe73fbe951003f833273a3fa02967603c",
    },
  ],
};

export default authNoAuth;
