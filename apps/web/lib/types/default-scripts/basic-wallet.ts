import { type Script, defaultScript } from "@/lib/types/script";

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

export const basicWalletMasm = `use.miden::account
use.miden::tx

# CONSTANTS
# =================================================================================================
const.PUBLIC_NOTE=1

#! Adds the provided asset to the current account.
#!
#! Inputs:  [ASSET, pad(12)]
#! Outputs: [pad(16)]
#!
#! Where:
#! - ASSET is the asset to be received, can be fungible or non-fungible
#!
#! Panics if:
#! - the same non-fungible asset already exists in the account.
#! - adding a fungible asset would result in amount overflow, i.e.,
#!   the total amount would be greater than 2^63.
#!
#! Invocation: call
export.receive_asset
    exec.account::add_asset
    # => [ASSET', pad(12)]

    # drop the final asset
    dropw
    # => [pad(16)]
end

#! Removes the specified asset from the account and adds it to the output note with the specified
#! index.
#!
#! This procedure is expected to be invoked using a \`call\` instruction. It makes no guarantees about
#! the contents of the \`PAD\` elements shown below. It is the caller's responsibility to make sure
#! these elements do not contain any meaningful data.
#!
#! Inputs:  [ASSET, note_idx, pad(11)]
#! Outputs: [ASSET, note_idx, pad(11)]
#!
#! Where:
#! - note_idx is the index of the output note.
#! - ASSET is the fungible or non-fungible asset of interest.
#!
#! Panics if:
#! - the fungible asset is not found in the vault.
#! - the amount of the fungible asset in the vault is less than the amount to be removed.
#! - the non-fungible asset is not found in the vault.
#!
#! Invocation: call
export.move_asset_to_note
    # remove the asset from the account
    exec.account::remove_asset
    # => [ASSET, note_idx, pad(11)]

    exec.tx::add_asset_to_note
    # => [ASSET, note_idx, pad(11) ...]
end`;

const basicWallet: Script = {
  ...defaultScript(),
  id: "basic-wallet",
  name: "Basic Wallet",
  packageName: "basic-wallet",
  type: "account",
  status: "compiled",
  readOnly: true,
  rust: basicWalletRust,
  masm: basicWalletMasm,
};

export default basicWallet;
