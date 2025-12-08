// Do not link against libstd (i.e. anything defined in `std::`)
#![no_std]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::*;

use crate::bindings::miden::cc::cc;

#[tx_script]
fn run(_arg: Word) {
    let block_number = tx::get_block_number();
    cc::increment_count_by(block_number);
}
