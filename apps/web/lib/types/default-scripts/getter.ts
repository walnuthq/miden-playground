import { type Script, defaultScript } from "@/lib/types/script";

export const getterMasm = `use.miden::native_account
use.miden::tx
use.std::sys

# => [account_id_prefix, account_id_suffix, proc_hash]
export.read_word
    exec.tx::execute_foreign_procedure
    # => [count]

    push.0
    # [index, count]

    exec.native_account::set_item
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
