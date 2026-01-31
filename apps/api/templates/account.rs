// Do not link against libstd (i.e. anything defined in `std::`)
#![no_std]
#![feature(alloc_error_handler)]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::*;

#[component]
struct MyAccount {
    // Storage
    #[storage(slot(0), description = "storage value")]
    value: Value,
}

#[component]
impl MyAccount {
    // Procedures
    pub fn get_value(&self) -> Word {
        self.value.read()
    }
}
