import {
  type Script,
  defaultScript,
  defaultProcedureExport,
  defaultSignature,
} from "@/lib/types/script";
import { COUNT_READER_COPY_COUNT_PROC_HASH } from "@/lib/constants";

export const countReaderRust = `#![no_std]
#![feature(alloc_error_handler)]

extern crate alloc;

use alloc::vec::Vec;
use miden::{component, tx, AccountId, Digest, Value, ValueAccess};

/// Main contract structure for the CountReader example.
#[component]
struct CountReader {
    /// Storage slot holding the counter value.
    #[storage(description = "count reader storage value")]
    count: Value,
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
        self.count.write(result[0]);
    }
}
`;

export const countReaderMasm = `use miden::protocol::native_account
use miden::protocol::tx
use miden::core::word
use miden::core::sys

const COUNTER_SLOT = word("miden::component::miden_count_reader::counter")

# => [account_id_prefix, account_id_suffix, get_count_proc_hash]
pub proc copy_count
    exec.tx::execute_foreign_procedure
    # => [count]

    push.COUNTER_SLOT[0..2] exec.native_account::set_item
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
  rust: countReaderRust,
  masm: countReaderMasm,
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
