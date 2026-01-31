// Do not link against libstd (i.e. anything defined in `std::`)
#![no_std]
#![feature(alloc_error_handler)]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;
// use alloc::vec::Vec;

use miden::*;

#[note]
struct MyNote;

#[note]
impl MyNote {
    #[note_script]
    pub fn run(self, _arg: Word) {
        //
    }
}
