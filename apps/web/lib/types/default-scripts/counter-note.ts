import { type Script, defaultScript } from "@/lib/types/script";

export const counterNoteRust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;
// use alloc::vec::Vec;

// Global allocator to use heap memory in no-std environment
#[global_allocator]
static ALLOC: miden::BumpAlloc = miden::BumpAlloc::new();

// Required for no-std crates
#[cfg(not(test))]
#[panic_handler]
fn my_panic(_info: &core::panic::PanicInfo) -> ! {
    loop {}
}

bindings::export!(IncrementCounterNote with_types_in bindings);

mod bindings;

use bindings::{exports::miden::base::note_script::Guest, miden::counter_contract::counter};
use miden::*;

struct IncrementCounterNote;

impl Guest for IncrementCounterNote {
    fn run(_arg: Word) {
        let initial_value = counter::get_count();
        counter::increment_count();
        let expected_value = initial_value + Felt::from_u32(1);
        let final_value = counter::get_count();
        assert_eq(final_value, expected_value);
    }
}
`;

export const counterNoteMasm = `use.miden::note
use.std::sys

const.ERR_ASSERT_FAILED="assert_eq failed"

begin
    push.1
    add.1
    push.2
    eq assert.err=ERR_ASSERT_FAILED
    exec.sys::truncate_stack
end
`;

// export const counterNoteMasm = `use.miden::note
// #use.std::sys

// #const.ERR_ASSERT_FAILED="assert_eq failed"

// begin
//     push.1
//     push.1
//     eq
//     exec.sys::truncate_stack

//     #call.counter_contract::get_count
//     # => [initial_value]

//     #call.counter_contract::increment_count
//     # => [new_value, initial_value]

//     #drop
//     # => [initial_value]

//     #add.1
//     # => [expected_value]

//     #call.counter_contract::get_count
//     # => [final_value, expected_value]

//     #eq assert.err=ERR_ASSERT_FAILED
//     # => []

//     #exec.sys::truncate_stack
//     # => []
// end
// `;

const counterNote: Script = {
  ...defaultScript(),
  id: "counter-note",
  name: "Counter Note",
  packageName: "counter-note",
  type: "note",
  status: "compiled",
  readOnly: true,
  rust: counterNoteRust,
  masm: counterNoteMasm,
  dependencies: ["counter-contract"],
};

export default counterNote;
