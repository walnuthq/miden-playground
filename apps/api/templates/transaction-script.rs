// Do not link against libstd (i.e. anything defined in `std::`)
#![no_std]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::*;

// use crate::bindings::miden::counter_contract::counter_contract;

#[tx_script]
fn run(_arg: Word) {
    // counter_contract::increment_count();
}
