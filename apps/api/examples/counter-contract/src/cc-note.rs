// Do not link against libstd (i.e. anything defined in `std::`)
#![no_std]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;
// use alloc::vec::Vec;

use miden::*;

use crate::bindings::miden::cc::cc;

#[note_script]
fn run(_arg: Word) {
    let inputs = active_note::get_inputs();
    let step = inputs[0];
    cc::increment_count_by(step);
}
