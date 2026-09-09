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
    fn receive_asset(&mut self, asset: Asset);

    /// Moves an asset from the account to a note.
    ///
    /// This function removes the specified asset from the account and adds it to
    /// the note identified by the given index.
    ///
    /// # Arguments
    /// * \`asset\` - The asset to move from the account to the note
    /// * \`note_idx\` - The index of the note to receive the asset
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
  digest: "0x3cde70c72d7990cd0cb443c43cef103a2fc52d4343e5b3a51175ab51ea55683b",
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::wallets::basic_wallet::create_note",
      digest:
        "0xf503aef4187744e1fac3d06add3fbd7d0609e196fb0701456bb9bce51c199af3",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::wallets::basic_wallet::move_asset_to_note",
      digest:
        "0x595bc83258726a66bd904912cfd5186c07cbd902dfbc115b7d6bc8105efc57e3",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::wallets::basic_wallet::receive_asset",
      digest:
        "0x34a56dd18f6fe5aab63198b9dcfc6467e793ebabb37d56b994b902504635da13",
    },
  ],
};

export default basicWallet;
