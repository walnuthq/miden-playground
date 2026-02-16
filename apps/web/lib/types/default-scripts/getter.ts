import { type Script, defaultScript } from "@/lib/types/script";

export const getterMasm = `use miden::protocol::native_account
use miden::protocol::tx
use miden::core::word
use miden::core::sys

const WORD_SLOT = word("miden::component::miden_getter::word")

# => [account_id_prefix, account_id_suffix, proc_hash]
pub proc read_word
    exec.tx::execute_foreign_procedure
    # => [count]

    push.WORD_SLOT[0..2] exec.native_account::set_item
    # => []

    exec.sys::truncate_stack
    # => []
end
`;

const getter: Script = {
  ...defaultScript(),
  id: "getter",
  name: "getter",
  type: "account",
  status: "compiled",
  readOnly: true,
  masm: getterMasm,
};

export default getter;
