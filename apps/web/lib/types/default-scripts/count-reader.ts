import { type Script, defaultScript } from "@/lib/types/script";
import { COUNTER_CONTRACT_GET_COUNT_PROC_HASH } from "@/lib/constants";

export const countReaderRust = ``;

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
  rust: countReaderRust,
  masm: countReaderMasm,
  procedures: [
    {
      name: "copy_count",
      inputs: [
        { name: "account_id", type: "account_id" },
        {
          name: "proc_hash",
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
