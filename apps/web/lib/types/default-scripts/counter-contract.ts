import { type Script, defaultScript } from "@/lib/types/script";

export const counterContractRust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
extern crate alloc;

// Global allocator to use heap memory in no-std environment
#[global_allocator]
static ALLOC: miden::BumpAlloc = miden::BumpAlloc::new();

// Define a panic handler as required by the \`no_std\` environment
#[cfg(not(test))]
#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    // For now, just loop indefinitely
    loop {}
}

mod bindings;

use bindings::exports::miden::counter_contract::counter::Guest;
use miden::{component, felt, Felt, StorageMap, StorageMapAccess, Word};

/// Main contract structure for the counter example.
#[component]
struct CounterContract {
    /// Storage map holding the counter value.
    #[storage(slot(0), description = "counter contract storage map")]
    count_map: StorageMap,
}

bindings::export!(CounterContract with_types_in bindings);

impl Guest for CounterContract {
    /// Returns the current counter value stored in the contract's storage map.
    fn get_count() -> Felt {
        // Get the instance of the contract
        let contract = CounterContract::default();
        // Define a fixed key for the counter value within the map
        let key = Word::from([felt!(0), felt!(0), felt!(0), felt!(1)]);
        // Read the value associated with the key from the storage map
        contract.count_map.get(&key)
    }

    /// Increments the counter value stored in the contract's storage map by one.
    fn increment_count() -> Felt {
        // Get the instance of the contract
        let contract = CounterContract::default();
        // Define the same fixed key
        let key = Word::from([felt!(0), felt!(0), felt!(0), felt!(1)]);
        // Read the current value
        let current_value: Felt = contract.count_map.get(&key);
        // Increment the value by one
        let new_value = current_value + felt!(1);
        // Write the new value back to the storage map
        contract.count_map.set(key, new_value);
        new_value
    }
}
`;

export const counterContractMasm = `use.miden::account
use.std::sys

const.COUNTER_SLOT=0

# => []
export.get_count
    push.COUNTER_SLOT
    # => [index]

    exec.account::get_item
    # => [count]

    exec.sys::truncate_stack
    # => []
end

# => []
export.increment_count
    push.COUNTER_SLOT
    # => [index]

    exec.account::get_item
    # => [count]

    add.1
    # => [count+1]

    debug.stack

    push.COUNTER_SLOT
    # [index, count+1]

    exec.account::set_item
    # => []

    exec.sys::truncate_stack
    # => []
end
`;

const counterContract: Script = {
  ...defaultScript(),
  id: "counter-contract",
  name: "Counter Contract",
  packageName: "counter-contract",
  type: "account",
  status: "compiled",
  rust: counterContractRust,
  masm: counterContractMasm,
  procedures: [
    {
      name: "get_count",
      inputs: [],
      returnType: "felt",
      readOnly: true,
      storageRead: { type: "value", index: 0 },
    },
    {
      name: "increment_count",
      inputs: [],
      returnType: "felt",
      readOnly: false,
    },
  ],
};

export default counterContract;
