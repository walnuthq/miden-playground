import {
  COUNTER_CONTRACT_GET_COUNT_PROC_HASH,
  COUNTER_CONTRACT_INCREMENT_COUNT_PROC_HASH,
} from "@/lib/constants";
import {
  type Script,
  defaultProcedureExport,
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
    #[storage(description = "counter contract storage value")]
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

export const counterContractMasm = `use miden::protocol::active_account
use miden::protocol::native_account
use miden::core::word
use miden::core::sys

const COUNTER_SLOT = word("miden::component::miden_counter_contract::counter")

#! Inputs:  []
#! Outputs: [count]
pub proc get_count
    push.COUNTER_SLOT[0..2] exec.active_account::get_item
    # => [count]

    exec.sys::truncate_stack
    # => [count]
end

#! Inputs:  []
#! Outputs: []
pub proc increment_count
    push.COUNTER_SLOT[0..2] exec.active_account::get_item
    # => [count]

    add.1
    # => [count+1]

    push.COUNTER_SLOT[0..2] exec.native_account::set_item
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
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "get_count",
      digest: COUNTER_CONTRACT_GET_COUNT_PROC_HASH,
      signature: {
        ...defaultSignature(),
        results: ["Felt"],
      },
      readOnly: true,
    },
    {
      ...defaultProcedureExport(),
      path: "increment_count",
      digest: COUNTER_CONTRACT_INCREMENT_COUNT_PROC_HASH,
      signature: {
        ...defaultSignature(),
        results: ["Felt"],
      },
    },
  ],
};

export default counterContract;
