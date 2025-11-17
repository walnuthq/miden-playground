import {
  COUNTER_CONTRACT_GET_COUNT_PROC_HASH,
  COUNTER_CONTRACT_INCREMENT_COUNT_PROC_HASH,
} from "@/lib/constants";
import { type Script, defaultScript } from "@/lib/types/script";

export const counterContractRust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

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
use miden::{component, felt, Felt, Value, ValueAccess};

/// Main contract structure for the counter example.
#[component]
struct CounterContract {
    /// Storage slot holding the counter value.
    #[storage(slot(0), description = "counter contract storage value")]
    count: Value,
}

bindings::export!(CounterContract with_types_in bindings);

impl Guest for CounterContract {
    /// Returns the current counter value stored in the contract's storage value.
    fn get_count() -> Felt {
        // Get the instance of the contract
        let contract = CounterContract::default();
        // Read the value from storage and return it
        contract.count.read()
    }

    /// Increments the counter value stored in the contract's storage by one.
    fn increment_count() -> Felt {
        // Get the instance of the contract
        let contract = CounterContract::default();
        // Read the current value
        let current_value: Felt = contract.count.read();
        // Increment the value by one
        let new_value = current_value + felt!(1);
        // Write the new value back to storage
        contract.count.write(new_value);
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
  readOnly: true,
  rust: counterContractRust,
  masm: counterContractMasm,
  procedures: [
    {
      name: "get_count",
      hash: COUNTER_CONTRACT_GET_COUNT_PROC_HASH,
      inputs: [],
      returnType: "felt",
      readOnly: true,
      storageRead: { type: "value", index: 0 },
    },
    {
      name: "increment_count",
      hash: COUNTER_CONTRACT_INCREMENT_COUNT_PROC_HASH,
      inputs: [],
      returnType: "felt",
      readOnly: false,
    },
  ],
};

export default counterContract;
