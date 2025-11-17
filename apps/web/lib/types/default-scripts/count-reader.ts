import { type Script, defaultScript } from "@/lib/types/script";
import {
  COUNTER_CONTRACT_GET_COUNT_PROC_HASH,
  COUNT_READER_COPY_COUNT_PROC_HASH,
} from "@/lib/constants";

export const countReaderRust = `#![no_std]

extern crate alloc;

use alloc::vec::Vec;
use miden::{component, tx, AccountId, Digest, Value, ValueAccess};

use crate::bindings::exports::miden::count_reader::count_reader::Guest;

miden::generate!();
bindings::export!(CountReader);

/// Main contract structure for the CountReader example.
#[component]
struct CountReader {
    /// Storage slot holding the counter value.
    #[storage(slot(0), description = "count reader storage value")]
    count: Value,
}

impl Guest for CountReader {
    /// Copy the count from a source contract into the CountReader own counter.
    /// This procedure takes 2 arguments: the CounterContract account ID to copy from and the
    /// get_count procedure hash.
    fn copy_count(counter_account_id: AccountId, get_count_proc_hash: Digest) {
        // Get the instance of the contract
        let contract = CountReader::default();
        // Execute a foreign procedure call on the counter contract, calling get_count and return
        // the result in a felt array
        let result =
            tx::execute_foreign_procedure(counter_account_id, get_count_proc_hash, Vec::new());
        // Copy the new value received from the foreign account in storage
        contract.count.write(result[0]);
    }
}
`;

export const countReaderMasm = `use.miden::account
use.miden::tx
use.std::sys

const.COUNTER_SLOT=0

# => [account_id_prefix, account_id_suffix, get_count_proc_hash]
export.copy_count
    exec.tx::execute_foreign_procedure
    # => [count]

    push.COUNTER_SLOT
    # [index, count]

    exec.account::set_item
    # => []

    exec.sys::truncate_stack
    # => []
end
`;

const countReader: Script = {
  ...defaultScript(),
  id: "count-reader",
  name: "Count Reader",
  packageName: "count-reader",
  type: "account",
  status: "compiled",
  readOnly: true,
  rust: countReaderRust,
  masm: countReaderMasm,
  procedures: [
    {
      name: "copy_count",
      hash: COUNT_READER_COPY_COUNT_PROC_HASH,
      inputs: [
        { name: "counter_account_id", type: "account_id" },
        {
          name: "get_count_proc_hash",
          type: "word",
          value: COUNTER_CONTRACT_GET_COUNT_PROC_HASH,
        },
      ],
      returnType: "void",
      readOnly: false,
    },
  ],
};

export default countReader;
