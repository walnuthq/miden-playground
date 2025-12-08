// Do not link against libstd (i.e. anything defined in `std::`)
#![no_std]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::*;

#[component]
struct NoAuth {}

#[component]
impl NoAuth {
    pub fn auth_procedure(&self, _arg: Word) {
        let init_comm = active_account::get_initial_commitment();
        let curr_comm = active_account::compute_commitment();
        // check if the account state has changed by comparing initial and final commitments
        if curr_comm != init_comm {
            // if the account has been updated, increment the nonce
            native_account::incr_nonce();
        }
    }
}
