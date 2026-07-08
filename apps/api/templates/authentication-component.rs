// Do not link against libstd (i.e. anything defined in `std::`)
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
        self.incr_nonce();
    }
}
