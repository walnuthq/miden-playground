import { BASIC_WALLET_CODE } from "@/lib/constants";
import { type Script, defaultScript, defaultExport } from "@/lib/types/script";

export const basicWalletRust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]
#![feature(alloc_error_handler)]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::{component, native_account, output_note, Asset, NoteIdx};

#[component]
struct MyAccount;

#[component]
impl MyAccount {
    /// Adds an asset to the account.
    ///
    /// This function adds the specified asset to the account's asset list.
    ///
    /// # Arguments
    /// * \`asset\` - The asset to be added to the account
    pub fn receive_asset(&mut self, asset: Asset) {
        self.add_asset(asset);
    }

    /// Moves an asset from the account to a note.
    ///
    /// This function removes the specified asset from the account and adds it to
    /// the note identified by the given index.
    ///
    /// # Arguments
    /// * \`asset\` - The asset to move from the account to the note
    /// * \`note_idx\` - The index of the note to receive the asset
    pub fn move_asset_to_note(&mut self, asset: Asset, note_idx: NoteIdx) {
        let asset = self.remove_asset(asset);
        output_note::add_asset(asset, note_idx);
    }
}
`;

export const basicWalletMasm = `use miden::protocol::native_account
use miden::protocol::output_note
use miden::protocol::active_note

# CONSTANTS
# =================================================================================================
const PUBLIC_NOTE=1

#! Adds the provided asset to the active account.
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
pub proc receive_asset
    exec.native_account::add_asset
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
pub proc move_asset_to_note
    # remove the asset from the account
    exec.native_account::remove_asset
    # => [ASSET, note_idx, pad(11)]

    dupw dup.8 movdn.4
    # => [ASSET, note_idx, ASSET, note_idx, pad(11)]

    exec.output_note::add_asset
    # => [ASSET, note_idx, pad(11)]
end

#! Adds all assets from the active note to the native account's vault.
#!
#! Inputs:  []
#! Outputs: []
@locals(1024)
pub proc add_assets_to_account
    # write assets to local memory starting at offset 0
    # we have allocated 4 * MAX_ASSETS_PER_NOTE number of locals so all assets should fit
    # since the asset memory will be overwritten, we don't have to initialize the locals to zero
    locaddr.0 exec.active_note::get_assets
    # => [num_of_assets, ptr = 0]

    # compute the pointer at which we should stop iterating
    mul.4 dup.1 add
    # => [end_ptr, ptr]

    # pad the stack and move the pointer to the top
    padw movup.5
    # => [ptr, EMPTY_WORD, end_ptr]

    # loop if the amount of assets is non-zero
    dup dup.6 neq
    # => [should_loop, ptr, EMPTY_WORD, end_ptr]

    while.true
        # => [ptr, EMPTY_WORD, end_ptr]

        # save the pointer so that we can use it later
        dup movdn.5
        # => [ptr, EMPTY_WORD, ptr, end_ptr]

        # load the asset
        mem_loadw_be
        # => [ASSET, ptr, end_ptr]

        # pad the stack before call
        padw swapw padw padw swapdw
        # => [ASSET, pad(12), ptr, end_ptr]

        # add asset to the account
        call.receive_asset
        # => [pad(16), ptr, end_ptr]

        # clean the stack after call
        dropw dropw dropw
        # => [EMPTY_WORD, ptr, end_ptr]

        # increment the pointer and continue looping if ptr != end_ptr
        movup.4 add.4 dup dup.6 neq
        # => [should_loop, ptr+4, EMPTY_WORD, end_ptr]
    end
    # => [ptr', EMPTY_WORD, end_ptr]

    # clear the stack
    drop dropw drop
    # => []
end
`;

const basicWallet: Script = {
  ...defaultScript(),
  id: "basic-wallet",
  name: "basic-wallet",
  type: "account",
  status: "compiled",
  readOnly: true,
  rust: basicWalletRust,
  masm: basicWalletMasm,
  digest: BASIC_WALLET_CODE,
  exports: [
    {
      ...defaultExport(),
      name: "receive_asset",
      digest:
        "0x6f4bdbdc4b13d7ed933d590d88ac9dfb98020c9e917697845b5e169395b76a01",
    },
    {
      ...defaultExport(),
      name: "move_asset_to_note",
      digest:
        "0x0e406b067ed2bcd7de745ca6517f519fd1a9be245f913347ac673ca1db30c1d6",
    },
  ],
};

export default basicWallet;
