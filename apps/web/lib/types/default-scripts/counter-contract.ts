import type { Script } from "@/lib/types/script";
import {
  defaultProcedureExport,
  defaultScript,
  defaultSignature,
} from "@/lib/utils/script";
import {
  COUNTER_CONTRACT_GET_COUNT_PROC_HASH,
  COUNTER_CONTRACT_INCREMENT_COUNT_PROC_HASH,
} from "@/lib/constants";

export const rust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]
#![feature(alloc_error_handler)]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::{Felt, StorageValue, Word, component, component_storage, felt};

/// Storage layout for the counter example.
#[component_storage]
struct CounterContractStorage {
    /// Storage slot holding the counter value.
    #[storage(description = "counter contract storage value")]
    count: StorageValue<Felt>,
}

/// API of the counter contract account component.
#[component]
trait CounterContract {
    /// Returns the current counter value stored in the contract's storage value.
    #[account_procedure]
    fn get_count(&self) -> Felt;
    /// Increments the counter value stored in the contract's storage value by one.
    #[account_procedure]
    fn increment_count(&mut self) -> Felt;
}

#[component]
impl CounterContract for CounterContractStorage {
    fn get_count(&self) -> Felt {
        // Read the value from storage
        self.count.get()
    }

    /// Increments the counter value stored in the contract's storage by one.
    fn increment_count(&mut self) -> Felt {
        // Read the current value
        let current_value = self.count.get();
        // Increment the value by one
        let new_value = current_value + felt!(1);
        // Write the new value back to storage
        self.count.set(new_value);
        new_value
    }
}
`;

export const masm = `use miden::protocol::active_account
use miden::protocol::native_account
use miden::core::sys

# CONSTANTS
# =================================================================================================

const COUNTER_SLOT = word("counter_contract::counter_contract::count")

# PUBLIC INTERFACE
# =================================================================================================

#! Returns the current count.
#!
#! Inputs:  [pad(16)]
#! Outputs: [count, pad(15)]
#!
#! Invocation: call
@account_procedure
pub proc get_count() -> felt
    push.COUNTER_SLOT[0..2] exec.active_account::get_item
    # => [[count, 0, 0, 0], pad(16)]

    exec.sys::truncate_stack
    # => [count, pad(15)]
end

#! Increments the current count by one.
#!
#! Inputs:  [pad(16)]
#! Outputs: [pad(16)]
#!
#! Invocation: call
@account_procedure
pub proc increment_count()
    push.COUNTER_SLOT[0..2] exec.active_account::get_item
    # => [[count, 0, 0, 0], pad(16)]

    add.1
    # => [[count + 1, 0, 0, 0], pad(16)]

    push.COUNTER_SLOT[0..2] exec.native_account::set_item
    # => [OLD_VALUE, pad(16)]

    dropw
    # => [pad(16)]

    exec.sys::truncate_stack
    # => [pad(16)]
end
`;

const counterContract: Script = {
  ...defaultScript(),
  id: "counter-contract",
  name: "counter-contract",
  type: "account-component",
  status: "compiled",
  readOnly: true,
  rust,
  masm,
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "get_count",
      digest: COUNTER_CONTRACT_GET_COUNT_PROC_HASH,
      signature: {
        ...defaultSignature(),
        results: [{ Struct: { name: "miden:base/core-types@1.0.0/felt" } }],
      },
      readOnly: true,
    },
    {
      ...defaultProcedureExport(),
      path: "increment_count",
      digest: COUNTER_CONTRACT_INCREMENT_COUNT_PROC_HASH,
      signature: {
        ...defaultSignature(),
        results: [{ Struct: { name: "miden:base/core-types@1.0.0/felt" } }],
      },
    },
  ],
};

export default counterContract;
