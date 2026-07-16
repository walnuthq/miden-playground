import { pick } from "lodash";
import type { Script } from "@/lib/types/script";
import {
  defaultScript,
  defaultProcedureExport,
  defaultSignature,
} from "@/lib/utils/script";
import counterContract from "@/lib/types/default-scripts/counter-contract";
import { COUNTER_SCRIPT_RUN_PROC_HASH } from "@/lib/constants";

export const rust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]
#![feature(alloc_error_handler)]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
//
// extern crate alloc;
// use alloc::vec::Vec;

use miden::*;

/// Native account of the note: exposes the \`counter-contract\` component methods gathered from the \`counter-contract\` package.
#[account(counter_account::CounterContract)]
pub struct CounterContract;

#[tx_script]
fn run(_arg: Word, account: &mut CounterContract) {
    account.increment_count();
}
`;

export const masm = `use external_contract::counter_contract

begin
    call.counter_contract::increment_count
end
`;

const counterScript: Script = {
  ...defaultScript(),
  id: "counter-script",
  name: "counter-script",
  type: "tx-script",
  status: "compiled",
  readOnly: true,
  rust,
  masm,
  dependencies: [pick(counterContract, "id", "name", "type", "digest")],
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: '::"miden:increment-script/miden-increment-script@0.1.0"::run',
      digest: COUNTER_SCRIPT_RUN_PROC_HASH,
      signature: { ...defaultSignature(), params: ["Word"] },
    },
  ],
};

export default counterScript;
