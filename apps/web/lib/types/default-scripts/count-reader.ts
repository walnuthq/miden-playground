import type { Script } from "@/lib/types/script";
import {
  defaultProcedureExport,
  defaultScript,
  defaultSignature,
} from "@/lib/utils/script";
import { COUNT_READER_COPY_COUNT_PROC_HASH } from "@/lib/constants";

export const rust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]
#![feature(alloc_error_handler)]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::{account, component, component_storage, AccountId, Felt, StorageValue};

#[account(counter_account::CounterContract)]
pub struct CounterContract;

#[component_storage]
struct CountReaderStorage {
    #[storage(description = "count reader storage value")]
    counter: StorageValue<Felt>,
}

#[component]
trait CountReader {
    fn copy_count(&mut self, counter_account_id: AccountId);
}

#[component]
impl CountReader for CountReaderStorage {
    fn copy_count(&mut self, counter_account_id: AccountId) {
        let counter_account = CounterContract::new(counter_account_id);
        self.counter.set(counter_account.get_count());
    }
}
`;

export const masm = `use miden::protocol::active_account
use miden::protocol::native_account
use miden::protocol::tx
use miden::core::word
use miden::core::sys

const COUNT_READER_SLOT = word("count_reader::count_reader::counter")

# => [account_id_suffix, account_id_prefix, PROC_HASH(4), foreign_procedure_inputs(16)]
pub proc copy_count
    exec.tx::execute_foreign_procedure
    # => [count, pad(12)]

    push.COUNT_READER_SLOT[0..2]
    # [slot_id_prefix, slot_id_suffix, count, pad(12)]

    exec.native_account::set_item
    # => [OLD_VALUE, pad(12)]

    dropw dropw dropw dropw
    # => []

    exec.sys::truncate_stack
    # => []
end
`;

const countReader: Script = {
  ...defaultScript(),
  id: "count-reader",
  name: "count-reader",
  type: "account-component",
  status: "compiled",
  readOnly: true,
  rust,
  masm,
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "copy_count",
      digest: COUNT_READER_COPY_COUNT_PROC_HASH,
      signature: {
        ...defaultSignature(),
        params: ["AccountId", "Word"],
      },
      // inputs: [
      //   { name: "counter_account_id", type: "account_id" },
      //   {
      //     name: "get_count_proc_hash",
      //     type: "word",
      //     value: COUNTER_CONTRACT_GET_COUNT_PROC_HASH,
      //   },
      // ],
    },
  ],
};

export default countReader;
