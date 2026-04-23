import type { Script } from "@/lib/types/script";
import {
  defaultProcedureExport,
  defaultScript,
  defaultSignature,
} from "@/lib/utils/script";
import { COUNT_READER_COPY_COUNT_PROC_HASH } from "@/lib/constants";

export const rust = `#![no_std]
#![feature(alloc_error_handler)]

extern crate alloc;

use alloc::vec::Vec;
use miden::*;

/// Main contract structure for the CountReader example.
#[component]
struct CountReader {
    /// Storage slot holding the counter value.
    #[storage(description = "count reader storage value")]
    count: StorageValue<Word>,
}

#[component]
impl CountReader {
    /// Copy the count from a source contract into the CountReader own counter.
    /// This procedure takes 2 arguments: the CounterContract account ID to copy from and the
    /// get_count procedure hash.
    pub fn copy_count(&mut self, counter_account_id: AccountId, get_count_proc_hash: Digest) {
        // Execute a foreign procedure call on the counter contract, calling get_count and return
        // the result in a felt array
        let result =
            tx::execute_foreign_procedure(counter_account_id, get_count_proc_hash, Vec::new());
        // Copy the new value received from the foreign account in storage
        self.count.set(result[0]);
    }
}
`;

export const masm = `use miden::protocol::active_account
use miden::protocol::native_account
use miden::protocol::tx
use miden::core::word
use miden::core::sys

const COUNT_READER_SLOT = word("miden_count_reader::count_reader::counter")

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
  type: "account",
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
