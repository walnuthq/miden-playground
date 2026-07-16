import type { Script } from "@/lib/types/script";
import {
  defaultProcedureExport,
  defaultScript,
  defaultSignature,
} from "@/lib/utils/script";

export const rust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]
#![feature(alloc_error_handler)]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::{Felt, StorageMap, Word, component, component_storage, felt};

/// Storage layout for the counter example.
#[component_storage]
struct CounterContractStorage {
    /// Storage map holding the counter value.
    #[storage(description = "counter contract storage map")]
    count_map: StorageMap<Word, Felt>,
}

/// API of the counter contract account component.
#[component]
trait CounterContract {
    /// Returns the current counter value stored in the contract's storage map.
    fn get_count(&self) -> Felt;
    /// Increments the counter value stored in the contract's storage map by one.
    fn increment_count(&mut self) -> Felt;
}

#[component]
impl CounterContract for CounterContractStorage {
    fn get_count(&self) -> Felt {
        let key = Word::new([felt!(1), felt!(0), felt!(0), felt!(0)]);
        self.count_map.get(key)
    }

    fn increment_count(&mut self) -> Felt {
        let key = Word::new([felt!(1), felt!(0), felt!(0), felt!(0)]);
        let current_value: Felt = self.count_map.get(key);
        let new_value = current_value + felt!(1);
        self.count_map.set(key, new_value);
        new_value
    }
}
`;

export const masm = `use miden::protocol::active_account
use miden::protocol::native_account
use miden::core::word
use miden::core::sys

const COUNTER_SLOT = word("counter_contract::counter_contract::count_map")

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
  type: "account-component",
  status: "compiled",
  readOnly: true,
  rust,
  masm,
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
