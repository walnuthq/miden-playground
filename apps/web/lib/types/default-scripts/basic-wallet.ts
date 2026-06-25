import type { Script } from "@/lib/types/script";
import { defaultProcedureExport, defaultScript } from "@/lib/utils/script";

export const rust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]
#![feature(alloc_error_handler)]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::{Asset, NoteIdx, component, output_note};

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
  type: "account",
  status: "compiled",
  readOnly: true,
  rust,
  masm,
  digest: "0x2d3dd7b37c470013f64bb7dce356cea29471f10fa35f04405452c0c59f53dc20",
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::wallets::basic_wallet::move_asset_to_note",
      digest:
        "0xfb1c73d10de1954e9e8948964e3e77cf4e33759d2e012cb00eb10c50f2974eb4",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::wallets::basic_wallet::receive_asset",
      digest:
        "0x6170fd6d682d91777b551fd866258f43cc657f1291f8f071500f4e56e9c153da",
    },
  ],
};

export default basicWallet;
