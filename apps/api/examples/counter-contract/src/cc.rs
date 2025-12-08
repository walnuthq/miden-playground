// Do not link against libstd (i.e. anything defined in `std::`)
#![no_std]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::{component, felt, Felt, Value, ValueAccess, Word};

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

    pub fn get_count_times_two(&self) -> Felt {
        let current_value: Felt = self.count.read();
        current_value * felt!(2)
    }

    pub fn get_word(&self) -> Word {
        Word::from([felt!(1), felt!(2), felt!(3), felt!(4)])
    }

    /// Increments the counter value stored in the contract's storage by one.
    pub fn increment_count_by(&self, step: Felt) -> Felt {
        let current_value: Felt = self.count.read();
        let new_value = current_value + step;
        self.count.write(new_value);
        new_value
    }
}
