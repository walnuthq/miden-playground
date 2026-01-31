import {
  COUNTER_CONTRACT_GET_COUNT_PROC_HASH,
  COUNTER_CONTRACT_INCREMENT_COUNT_PROC_HASH,
} from "@/lib/constants";
import {
  type Script,
  defaultExport,
  defaultScript,
  defaultSignature,
} from "@/lib/types/script";

export const counterContractRust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]
#![feature(alloc_error_handler)]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::{component, felt, Felt, Value, ValueAccess};

/// Main contract structure for the counter example.
#[component]
struct CounterContract {
    /// Storage slot holding the counter value.
    #[storage(slot(0), description = "counter contract storage value")]
    count: Value,
}

#[component]
impl CounterContract {
    /// Returns the current counter value stored in the contract's storage value.
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
  name: "counter-contract",
  type: "account",
  status: "compiled",
  readOnly: true,
  rust: counterContractRust,
  masm: counterContractMasm,
  exports: [
    {
      ...defaultExport(),
      name: "get_count",
      digest: COUNTER_CONTRACT_GET_COUNT_PROC_HASH,
      signature: {
        ...defaultSignature(),
        results: ["Felt"],
      },
      readOnly: true,
    },
    {
      ...defaultExport(),
      name: "increment_count",
      digest: COUNTER_CONTRACT_INCREMENT_COUNT_PROC_HASH,
      signature: {
        ...defaultSignature(),
        results: ["Felt"],
      },
    },
  ],
};

export default counterContract;
