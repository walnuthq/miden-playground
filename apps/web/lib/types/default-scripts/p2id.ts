import { type Script, defaultScript } from "@/lib/types/script";
import { P2ID_NOTE_CODE } from "@/lib/constants";

export const p2idRust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
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

bindings::export!(MyNote with_types_in bindings);

mod bindings;

use bindings::{
    exports::miden::base::note_script::Guest, miden::basic_wallet::basic_wallet::receive_asset,
};
use miden::*;

struct MyNote;

impl Guest for MyNote {
    fn run(_arg: Word) {
        let inputs = miden::note::get_inputs();
        let target_account_id_prefix = inputs[0];
        let target_account_id_suffix = inputs[1];
        let account_id = miden::account::get_id();
        assert_eq(account_id.prefix, target_account_id_prefix);
        assert_eq(account_id.suffix, target_account_id_suffix);
        let assets = miden::note::get_assets();
        for asset in assets {
            receive_asset(asset);
        }
    }
}
`;

export const p2idMasm = `use.miden::account
use.miden::account_id
use.miden::note

# ERRORS
# =================================================================================================

const.ERR_P2ID_WRONG_NUMBER_OF_INPUTS="P2ID note expects exactly 2 note inputs"

const.ERR_P2ID_TARGET_ACCT_MISMATCH="P2ID's target account address and transaction address do not match"

#! Pay-to-ID script: adds all assets from the note to the account, assuming ID of the account
#! matches target account ID specified by the note inputs.
#!
#! Requires that the account exposes:
#! - miden::contracts::wallets::basic::receive_asset procedure.
#!
#! Inputs:  []
#! Outputs: []
#!
#! Note inputs are assumed to be as follows:
#! - target_account_id is the ID of the account for which the note is intended.
#!
#! Panics if:
#! - Account does not expose miden::contracts::wallets::basic::receive_asset procedure.
#! - Account ID of executing account is not equal to the Account ID specified via note inputs.
#! - The same non-fungible asset already exists in the account.
#! - Adding a fungible asset would result in amount overflow, i.e., the total amount would be
#!   greater than 2^63.
begin
    # store the note inputs to memory starting at address 0
    padw push.0 exec.note::get_inputs
    # => [num_inputs, inputs_ptr, EMPTY_WORD]

    # make sure the number of inputs is 2
    eq.2 assert.err=ERR_P2ID_WRONG_NUMBER_OF_INPUTS
    # => [inputs_ptr, EMPTY_WORD]

    # read the target account ID from the note inputs
    mem_loadw drop drop
    # => [target_account_id_prefix, target_account_id_suffix]

    exec.account::get_id
    # => [account_id_prefix, account_id_suffix, target_account_id_prefix, target_account_id_suffix, ...]

    # ensure account_id = target_account_id, fails otherwise
    exec.account_id::is_equal assert.err=ERR_P2ID_TARGET_ACCT_MISMATCH
    # => []

    exec.note::add_assets_to_account
    # => []
end
`;

const p2id: Script = {
  ...defaultScript(),
  id: "p2id",
  name: "P2ID",
  packageName: "p2id",
  type: "note",
  status: "compiled",
  rust: p2idRust,
  masm: p2idMasm,
  root: P2ID_NOTE_CODE,
};

export default p2id;
