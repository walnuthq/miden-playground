import { type Script } from "@/lib/types";

export const noAuthMasm = `use.miden::account

#! Increment the nonce only if the account commitment has changed
#!
#! This authentication procedure provides minimal authentication by checking if the account
#! state has actually changed during transaction execution. It compares the initial account
#! commitment with the current commitment and only increments the nonce if they differ.
#! This avoids unnecessary nonce increments for transactions that don't modify
#! the account state.
#!
#! Inputs:  [pad(16)]
#! Outputs: [pad(16)]
export.auth__no_auth
    # check if the account state has changed by comparing initial and final commitments

    exec.account::get_initial_commitment
    # => [INITIAL_COMMITMENT, pad(16)]

    exec.account::compute_current_commitment
    # => [CURRENT_COMMITMENT, INITIAL_COMMITMENT, pad(16)]

    # TODO: use std::word::eq when it becomes available
    eqw not movdn.8 dropw dropw
    # => [has_account_state_changed, pad(16)]

    # if the account has been updated, increment the nonce
    if.true
        exec.account::incr_nonce drop
    end
end
`;

export const noAuthScript: Script = {
  id: "no-auth",
  name: "No Auth Script",
  type: "account",
  status: "compiled",
  rust: "",
  masm: noAuthMasm,
  error: "",
  updatedAt: 0,
};

export const basicAuthMasm = `# The MASM code of the RPO Falcon 512 authentication Account Component.
#
# See the \`AuthRpoFalcon512\` Rust type's documentation for more details.

use.miden::auth::rpo_falcon512
use.miden::account

# CONSTANTS
# =================================================================================================

# The slot in this component's storage layout where the public key is stored.
const.PUBLIC_KEY_SLOT=0

#! Authenticate a transaction using the Falcon signature scheme.
#!
#! It first increments the nonce of the account, independent of whether the account's state has
#! changed or not. Then it computes and signs the following message (in memory order):
#! [ACCOUNT_DELTA_COMMITMENT, INPUT_NOTES_COMMITMENT,
#!  OUTPUT_NOTES_COMMITMENT, [0, 0, ref_block_num, final_nonce]]
#!
#! Including the final_nonce is necessary for replay protection. The reference block number is
#! included to commit to the transaction creator's intended reference block of the transaction
#! which determines the fee parameters and therefore the fee amount that is deducted.
#!
#! Inputs:  [AUTH_ARGS, pad(12)]
#! Outputs: [pad(16)]
#!
#! Invocation: call
export.auth__tx_rpo_falcon512
    dropw
    # => [pad(16)]

    # Fetch public key from storage.
    # ---------------------------------------------------------------------------------------------
    push.PUBLIC_KEY_SLOT exec.account::get_item
    # => [PUB_KEY, pad(16)]

    exec.rpo_falcon512::authenticate_transaction
    # => [pad(16)]
end
`;

export const basicAuthRust = "";

export const basicAuthScript: Script = {
  id: "basic-auth",
  name: "Basic Auth Script",
  type: "account",
  status: "compiled",
  rust: basicAuthRust,
  masm: basicAuthMasm,
  error: "",
  updatedAt: 0,
};

export const p2idMasm = `use.miden::account
use.miden::account_id
use.miden::note

# ERRORS
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

export const p2idScript: Script = {
  id: "p2id",
  name: "P2ID Script",
  type: "note",
  status: "compiled",
  rust: p2idRust,
  masm: p2idMasm,
  error: "",
  updatedAt: 0,
};

export const basicWalletMasm = `# The MASM code of the Basic Wallet Account Component.
#
# See the \`BasicWallet\` Rust type's documentation for more details.

export.::miden::contracts::wallets::basic::receive_asset
export.::miden::contracts::wallets::basic::move_asset_to_note
`;

export const basicWalletRust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
extern crate alloc;

// Global allocator to use heap memory in no-std environment
#[global_allocator]
static ALLOC: miden::BumpAlloc = miden::BumpAlloc::new();

// Required for no-std crates
#[cfg(not(test))]
#[panic_handler]
fn my_panic(_info: &core::panic::PanicInfo) -> ! {
    loop {}
}

mod bindings;

use bindings::exports::miden::basic_wallet::*;
use miden::NoteIdx;

bindings::export!(MyAccount with_types_in bindings);

use miden::{component, Asset};

#[component]
struct MyAccount;

impl basic_wallet::Guest for MyAccount {
    /// Adds an asset to the account.
    ///
    /// This function adds the specified asset to the account's asset list.
    ///
    /// # Arguments
    /// * \`asset\` - The asset to be added to the account
    fn receive_asset(asset: Asset) {
        miden::account::add_asset(asset);
    }

    /// Moves an asset from the account to a note.
    ///
    /// This function removes the specified asset from the account and adds it to
    /// the note identified by the given index.
    ///
    /// # Arguments
    /// * \`asset\` - The asset to move from the account to the note
    /// * \`note_idx\` - The index of the note to receive the asset
    fn move_asset_to_note(asset: Asset, note_idx: NoteIdx) {
        let asset = miden::account::remove_asset(asset);
        miden::tx::add_asset_to_note(asset, note_idx);
    }
}
`;

export const basicWalletScript: Script = {
  id: "basic-wallet",
  name: "Basic Wallet Script",
  type: "account",
  status: "compiled",
  rust: basicWalletRust,
  masm: basicWalletMasm,
  error: "",
  updatedAt: 0,
};

export const counterContractScript: Script = {
  id: "counter-contract",
  name: "Counter Contract",
  type: "account",
  status: "compiled",
  rust: "// Do not link against libstd (i.e. anything defined in `std::`)\n#![no_std]\n\n// However, we could still use some standard library types while\n// remaining no-std compatible, if we uncommented the following lines:\n//\nextern crate alloc;\n\n// Global allocator to use heap memory in no-std environment\n#[global_allocator]\nstatic ALLOC: miden::BumpAlloc = miden::BumpAlloc::new();\n\n// Define a panic handler as required by the `no_std` environment\n#[cfg(not(test))]\n#[panic_handler]\nfn panic(_info: &core::panic::PanicInfo) -> ! {\n    // For now, just loop indefinitely\n    loop {}\n}\n\nmod bindings;\n\nuse bindings::exports::miden::counter_contract::counter::Guest;\nuse miden::{component, felt, Felt, StorageMap, StorageMapAccess, Word};\n\n/// Main contract structure for the counter example.\n#[component]\nstruct CounterContract {\n    /// Storage map holding the counter value.\n    #[storage(slot(0), description = \"counter contract storage map\")]\n    count_map: StorageMap,\n}\n\nbindings::export!(CounterContract with_types_in bindings);\n\nimpl Guest for CounterContract {\n    /// Returns the current counter value stored in the contract's storage map.\n    fn get_count() -> Felt {\n        // Get the instance of the contract\n        let contract = CounterContract::default();\n        // Define a fixed key for the counter value within the map\n        let key = Word::from([felt!(0), felt!(0), felt!(0), felt!(1)]);\n        // Read the value associated with the key from the storage map\n        contract.count_map.get(&key)\n    }\n\n    /// Increments the counter value stored in the contract's storage map by one.\n    fn increment_count() -> Felt {\n        // Get the instance of the contract\n        let contract = CounterContract::default();\n        // Define the same fixed key\n        let key = Word::from([felt!(0), felt!(0), felt!(0), felt!(1)]);\n        // Read the current value\n        let current_value: Felt = contract.count_map.get(&key);\n        // Increment the value by one\n        let new_value = current_value + felt!(1);\n        // Write the new value back to the storage map\n        contract.count_map.set(key, new_value);\n        new_value\n    }\n}\n",
  masm: "use.miden::account\nuse.std::sys\n\n# => []\nexport.get_count\n    push.0\n    # => [index]\n\n    # exec.account::get_item\n    # => [count]\n\n    # exec.sys::truncate_stack\n    # => []\nend\n\n# => []\nexport.increment_count\n    push.0\n    # => [index]\n\n    exec.account::get_item\n    # => [count]\n\n    push.1 add\n    # => [count+1]\n\n    # debug statement with client\n    debug.stack\n\n    push.0\n    # [index, count+1]\n\n    exec.account::set_item\n    # => []\n\n    push.1 exec.account::incr_nonce\n    # => []\n\n    exec.sys::truncate_stack\n    # => []\nend\n",
  error: "",
  updatedAt: 0,
};

const defaultScripts = [
  noAuthScript,
  basicAuthScript,
  p2idScript,
  basicWalletScript,
  //counterContractScript,
];

export default defaultScripts;
