import {
  COUNTER_CONTRACT_GET_COUNT_PROC_HASH,
  COUNTER_CONTRACT_INCREMENT_COUNT_PROC_HASH,
} from "@/lib/constants";
import {
  type Script,
  defaultProcedure,
  defaultScript,
} from "@/lib/types/script";

export const counterContractRust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::{component, felt, Felt, Value, ValueAccess};

use crate::bindings::exports::miden::counter_contract::counter::Guest;

miden::generate!();
bindings::export!(CounterContract);

/// Main contract structure for the counter example.
#[component]
struct CounterContract {
    /// Storage slot holding the counter value.
    #[storage(slot(0), description = "counter contract storage value")]
    count: Value,
}

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

export const counterContractMasm = `use.miden::active_account
use.miden::native_account
use.std::sys

const.COUNTER_SLOT=0

# => []
export.get_count
    push.COUNTER_SLOT
    # => [index]

    exec.active_account::get_item
    # => [count]

    exec.sys::truncate_stack
    # => []
end

# => []
export.increment_count
    push.COUNTER_SLOT
    # => [index]

    exec.active_account::get_item
    # => [count]

    add.1
    # => [count+1]

    debug.stack

    push.COUNTER_SLOT
    # [index, count+1]

    exec.native_account::set_item
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
      ...defaultProcedure(),
      name: "get_count",
      hash: COUNTER_CONTRACT_GET_COUNT_PROC_HASH,
      returnType: "felt",
      readOnly: true,
      storageRead: { type: "value", index: 0 },
    },
    {
      ...defaultProcedure(),
      name: "increment_count",
      hash: COUNTER_CONTRACT_INCREMENT_COUNT_PROC_HASH,
      returnType: "felt",
    },
  ],
};

export default counterContract;
