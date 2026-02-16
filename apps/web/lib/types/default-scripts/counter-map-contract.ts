import {
  type Script,
  defaultScript,
  defaultProcedureExport,
  defaultSignature,
} from "@/lib/types/script";

export const counterMapContractRust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]
#![feature(alloc_error_handler)]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::{component, felt, Felt, StorageMap, StorageMapAccess, Word};

/// Main contract structure for the counter example.
#[component]
struct CounterContract {
    /// Storage map holding the counter value.
    #[storage(description = "counter contract storage map")]
    count_map: StorageMap,
}

#[component]
impl CounterContract {
    /// Returns the current counter value stored in the contract's storage map.
    pub fn get_count(&self) -> Felt {
        let key = Word::from_u64_unchecked(0, 0, 0, 1);
        self.count_map.get(&key)
    }

    /// Increments the counter value stored in the contract's storage map by one.
    pub fn increment_count(&mut self) -> Felt {
        let key = Word::from_u64_unchecked(0, 0, 0, 1);
        let current_value: Felt = self.count_map.get(&key);
        let new_value = current_value + felt!(1);
        self.count_map.set(key, new_value);
        new_value
    }
}
`;

export const counterMapContractMasm = `use miden::protocol::active_account
use miden::protocol::native_account
use miden::core::word
use miden::core::sys

const COUNTER_SLOT = word("miden::component::miden_counter_contract::count_map")

#! Inputs:  []
#! Outputs: [count]
pub proc get_count
    push.0.0.0.1 push.COUNTER_SLOT[0..2] exec.active_account::get_map_item
    # => [count]

    exec.sys::truncate_stack
    # => [count]
end

#! Inputs:  []
#! Outputs: []
pub proc increment_count
    push.0.0.0.1 push.COUNTER_SLOT[0..2] exec.active_account::get_map_item
    # => [count]

    add.1
    # => [count+1]

    push.0.0.0.1 push.COUNTER_SLOT[0..2] exec.native_account::set_map_item
    # => [old_value]

    exec.sys::truncate_stack
    # => []
end
`;

const counterMapContract: Script = {
  ...defaultScript(),
  id: "counter-map-contract",
  name: "counter-map-contract",
  type: "account",
  status: "compiled",
  readOnly: true,
  rust: counterMapContractRust,
  masm: counterMapContractMasm,
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "get_count",
      digest:
        "0xa5786be8056e5650452d712e1f736a2c0d07f26f061bce8186d39054e00de2dc",
      signature: {
        ...defaultSignature(),
        results: ["Felt"],
      },
      readOnly: true,
    },
    {
      ...defaultProcedureExport(),
      path: "increment_count",
      digest:
        "0x52bcd648b2678a5fda8024d96e01cc794ba16dc13c7ce48e9cc7a9f69cd02590",
      signature: {
        ...defaultSignature(),
        results: ["Felt"],
      },
    },
  ],
};

export default counterMapContract;
