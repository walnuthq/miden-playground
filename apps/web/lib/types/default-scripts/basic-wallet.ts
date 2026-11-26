import type {
  MidenTypeLayout,
  ProcedureExport,
  Script,
} from "@/lib/types/script";
import { defaultProcedureExport, defaultScript } from "@/lib/utils/script";
import { sourceFiles } from "@/lib/utils/script-files";

export const masm = `# The MASM code of the Basic Wallet Account Component.
#
# See the \`BasicWallet\` Rust type's documentation for more details.

pub use {receive_asset} from miden::standards::wallets::basic
pub use {move_asset_to_note} from miden::standards::wallets::basic
pub use {create_note} from miden::standards::wallets::basic
`;

// The procedures' signatures, as api-compile lays out the basic-wallet
// template's (apps/api/templates/basic-wallet.masm, which copies these
// procedures of miden-standards instruction for instruction): the forms then
// ask for the arguments. A tag is a `u32`, a note type an enum, a note index a
// `u16`, each entered as a bounded felt, and a recipient a word.
const word: MidenTypeLayout = { Array: { ty: "Felt", len: 4 } };

const asset: MidenTypeLayout = {
  Struct: {
    name: "Asset",
    repr: "Default",
    size: 32,
    fields: [
      { name: "id", ty: word },
      { name: "value", ty: word },
    ],
  },
};

const noteType: MidenTypeLayout = {
  Enum: {
    name: "NoteType",
    discriminant: "U8",
    variants: [
      { name: "PRIVATE", discriminant_value: 0, value: null },
      { name: "PUBLIC", discriminant_value: 1, value: null },
    ],
    offsets: [0, 0],
    size: 1,
    align: 1,
  },
};

const signature = (
  params: [name: string, type: string, layout: MidenTypeLayout][],
  results: MidenTypeLayout[] = [],
): Pick<ProcedureExport, "signature" | "parameters"> => ({
  signature: {
    ...defaultProcedureExport().signature,
    params: params.map(([, , layout]) => layout),
    results,
  },
  parameters: params.map(([name, type]) => ({ name, type })),
});

const basicWallet: Script = {
  ...defaultScript(),
  id: "basic-wallet",
  name: "basic-wallet",
  type: "account-component",
  status: "compiled",
  readOnly: true,
  files: sourceFiles("basic-wallet", masm),
  masm,
  commitment:
    "0xf2e5b2d0bfee8029ebc6ef3ca234585452fb5c9467f41c878c9e245f59b00719",
  // No storage (an absent schema would mean unknown).
  metadata: { storage: { slots: [] } },
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::wallets::basic_wallet::create_note",
      ...signature(
        [
          ["tag", "NoteTag", "U32"],
          ["note_type", "NoteType", noteType],
          ["recipient", "NoteRecipient", word],
        ],
        ["U16"],
      ),
      digest:
        "0x27641b79c8aec7ec29820c907eb5c05134b7d02cf69e7e73a5b7dcd09c803a95",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::wallets::basic_wallet::move_asset_to_note",
      ...signature([
        ["asset", "Asset", asset],
        ["note_idx", "u16", "U16"],
      ]),
      digest:
        "0xf261e7bdd1faee5db3b0abe4bb67b153fbca6ece3e456b83eff98697f21f6a97",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::wallets::basic_wallet::receive_asset",
      ...signature([["asset", "Asset", asset]]),
      digest:
        "0xd7416b798a70aabbca510c3cd0f48ba35473b5d76dc302375157c6f563fffc15",
    },
  ],
};

export default basicWallet;
