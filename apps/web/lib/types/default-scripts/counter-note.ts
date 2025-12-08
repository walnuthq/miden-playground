import {
  type Script,
  defaultDependencies,
  defaultScript,
} from "@/lib/types/script";

export const counterNoteRust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;
// use alloc::vec::Vec;

use miden::*;

use crate::bindings::miden::counter_contract::counter_contract;

#[note_script]
fn run(_arg: Word) {
    counter_contract::increment_count();
}
`;

export const counterNoteMasm = `use.external_contract::counter_contract

begin
    call.counter_contract::increment_count
end
`;

const counterNote: Script = {
  ...defaultScript(),
  id: "counter-note",
  name: "counter-note",
  type: "note-script",
  status: "compiled",
  readOnly: true,
  rust: counterNoteRust,
  masm: counterNoteMasm,
  dependencies: [
    ...defaultDependencies(),
    { id: "counter-contract", name: "counter-contract", digest: "" },
  ],
};

export default counterNote;
