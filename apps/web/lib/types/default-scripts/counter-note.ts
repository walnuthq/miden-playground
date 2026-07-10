import { pick } from "lodash";
import type { Script } from "@/lib/types/script";
import { defaultScript } from "@/lib/utils/script";
import counterContract from "@/lib/types/default-scripts/counter-contract";

export const rust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]
#![feature(alloc_error_handler)]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;
// use alloc::vec::Vec;

use miden::*;

/// Native account of the note: exposes the \`counter-contract\` component methods gathered from the \`counter-contract\` package.
#[account(counter_account::CounterContract)]
pub struct CounterContract;

#[note]
struct IncrementNote;

#[note]
impl IncrementNote {
    #[note_script]
    fn run(self, _arg: Word, account: &mut CounterContract) {
        let initial_value = account.get_count();
        account.increment_count();
        let expected_value = initial_value + Felt::from_u32(1);
        let final_value = account.get_count();
        assert_eq(final_value, expected_value);
    }
}
`;

export const masm = `use external_contract::counter_contract

#! Inputs:  []
#! Outputs: []
@note_script
pub proc main
    call.counter_contract::increment_count
end
`;

const counterNote: Script = {
  ...defaultScript(),
  id: "counter-note",
  name: "counter-note",
  type: "note",
  status: "compiled",
  readOnly: true,
  rust,
  masm,
  dependencies: [pick(counterContract, "id", "name", "type", "digest")],
};

export default counterNote;
