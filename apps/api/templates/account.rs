// Do not link against libstd (i.e. anything defined in `std::`)
#![no_std]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::{component, felt, Felt, Value, ValueAccess};

/// Main contract structure for the counter example.
#[component]
struct CounterContract {
    /// Storage slot holding the counter value.
    #[storage(slot(0), description = "counter contract storage slot")]
    count: Value,
}

#[component]
impl CounterContract {
    /// Returns the current counter value stored in the contract's storage slot.
    pub fn get_count(&self) -> Felt {
        self.count.read()
    }

    /// Increments the counter value stored in the contract's storage by one.
    pub fn increment_count(&mut self) -> Felt {
        let current_value: Felt = self.count.read();
        let new_value = current_value + felt!(1);
        self.count.write(new_value);
        new_value
    }
}
