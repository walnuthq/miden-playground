import {
  type Script,
  defaultScript,
  defaultExport,
  defaultSignature,
} from "@/lib/types/script";

export const counterMapContractRust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::{component, felt, Felt, StorageMap, StorageMapAccess, Word};

/// Main contract structure for the counter example.
#[component]
struct CounterContract {
    /// Storage map holding the counter value.
    #[storage(slot(0), description = "counter contract storage map")]
    count_map: StorageMap,
}

#[component]
impl CounterContract {
    /// Returns the current counter value stored in the contract's storage map.
    pub fn get_count(&self) -> Felt {
        let key = Word::from([felt!(0), felt!(0), felt!(0), felt!(1)]);
        self.count_map.get(&key)
    }

    /// Increments the counter value stored in the contract's storage map by one.
    pub fn increment_count(&self) -> Felt {
        let key = Word::from([felt!(0), felt!(0), felt!(0), felt!(1)]);
        let current_value: Felt = self.count_map.get(&key);
        let new_value = current_value + felt!(1);
        self.count_map.set(key, new_value);
        new_value
    }
}
`;

export const counterMapContractMasm = `use.miden::active_account
use.miden::native_account
use.std::sys

# => []
export.get_count
    push.0.0.0.1
    # => [key]

    push.0
    # => [index, key]

    exec.active_account::get_map_item
    # => [count]
end

# => []
export.increment_count
    push.0.0.0.1
    # => [key]

    push.0
    # => [index, key]

    exec.active_account::get_map_item
    # => [count]

    add.1
    # => [count+1]

    push.0.0.0.1
    # => [key, count+1]

    push.0
    # => [index, key, count+1]

    exec.native_account::set_map_item
    # => [OLD_MAP_ROOT, OLD_MAP_VALUE]

    exec.sys::truncate_stack
    # => []
end
`;

const counterMapContract: Script = {
  ...defaultScript(),
  id: "counter-map-contract",
  name: "Counter Map Contract",
  packageName: "counter-map-contract",
  type: "account",
  status: "compiled",
  readOnly: true,
  rust: counterMapContractRust,
  masm: counterMapContractMasm,
  exports: [
    {
      ...defaultExport(),
      name: "get_count",
      digest:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      signature: {
        ...defaultSignature(),
        results: ["Felt"],
      },
      readOnly: true,
      storageRead: { type: "map", index: 0, key: ["0", "0", "0", "1"] },
    },
    {
      ...defaultExport(),
      name: "increment_count",
      digest:
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      signature: {
        ...defaultSignature(),
        results: ["Felt"],
      },
    },
  ],
};

export default counterMapContract;
