import type { Script } from "@/lib/types/script";
import { defaultProcedureExport, defaultScript } from "@/lib/utils/script";

export const rust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]
#![feature(alloc_error_handler)]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::{Asset, NoteIdx, component, component_storage, output_note};

#[component_storage]
struct BasicWalletStorage;

/// API of the basic wallet account component.
#[component]
trait BasicWallet {
    /// Adds an asset to the account.
    ///
    /// This function adds the specified asset to the account's asset list.
    ///
    /// # Arguments
    /// * \`asset\` - The asset to be added to the account
    #[account_procedure]
    fn receive_asset(&mut self, asset: Asset);

    /// Moves an asset from the account to a note.
    ///
    /// This function removes the specified asset from the account and adds it to
    /// the note identified by the given index.
    ///
    /// # Arguments
    /// * \`asset\` - The asset to move from the account to the note
    /// * \`note_idx\` - The index of the note to receive the asset
    #[account_procedure]
    fn move_asset_to_note(&mut self, asset: Asset, note_idx: NoteIdx);
}

#[component]
impl BasicWallet for BasicWalletStorage {
    fn receive_asset(&mut self, asset: Asset) {
        self.add_asset(asset);
    }

    fn move_asset_to_note(&mut self, asset: Asset, note_idx: NoteIdx) {
        self.remove_asset(asset);
        output_note::add_asset(asset, note_idx);
    }
}
`;

export const masm = `# The MASM code of the Basic Wallet Account Component.
#
# See the \`BasicWallet\` Rust type's documentation for more details.

pub use ::miden::standards::wallets::basic::receive_asset
pub use ::miden::standards::wallets::basic::move_asset_to_note
`;

const basicWallet: Script = {
  ...defaultScript(),
  id: "basic-wallet",
  name: "basic-wallet",
  type: "account-component",
  status: "compiled",
  readOnly: true,
  rust,
  masm,
  digest: "0xf2e5b2d0bfee8029ebc6ef3ca234585452fb5c9467f41c878c9e245f59b00719",
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::wallets::basic_wallet::create_note",
      digest:
        "0x27641b79c8aec7ec29820c907eb5c05134b7d02cf69e7e73a5b7dcd09c803a95",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::wallets::basic_wallet::move_asset_to_note",
      digest:
        "0xf261e7bdd1faee5db3b0abe4bb67b153fbca6ece3e456b83eff98697f21f6a97",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::wallets::basic_wallet::receive_asset",
      digest:
        "0xd7416b798a70aabbca510c3cd0f48ba35473b5d76dc302375157c6f563fffc15",
    },
  ],
};

export default basicWallet;
