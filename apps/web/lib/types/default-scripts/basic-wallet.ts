import type { Script } from "@/lib/types/script";
import { defaultProcedureExport, defaultScript } from "@/lib/utils/script";

export const rust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
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
  type: "account",
  status: "compiled",
  readOnly: true,
  rust,
  masm,
  digest: "0x284a73415341ff23381565be111550bc1c4f5c94cceec109f473a3dbf19ee030",
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::wallets::basic_wallet::move_asset_to_note",
      digest:
        "0x6d30df4312a2c44ec842db1bee227cc045396ca91e2c47d756dcb607f2bf5f89",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::wallets::basic_wallet::receive_asset",
      digest:
        "0x75f638c65584d058542bcf4674b066ae394183021bc9b44dc2fdd97d52f9bcfb",
    },
  ],
};

export default basicWallet;
