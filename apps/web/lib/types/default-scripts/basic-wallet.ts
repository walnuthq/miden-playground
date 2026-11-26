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

// The procedures' signatures, as midenc lays out the Rust basic wallet's
// (lib/tutorials/basic-wallet.json), which wraps the same kernel procedures
// with the same stack inputs: the forms then ask for the arguments. A tag, a
// note type and a note index are a felt, a recipient a word; the forms don't
// type them, so they're entered as raw felts (`feltLeaves`).
const CORE_TYPES = "miden:base/core-types@1.0.0";

const felt: MidenTypeLayout = {
  Struct: {
    name: `${CORE_TYPES}/felt`,
    size: 4,
    fields: [{ name: "inner", ty: "Felt" }],
  },
};

const feltNewtype = (name: string): MidenTypeLayout => ({
  Struct: { name, size: 4, fields: [{ name: "inner", ty: felt }] },
});

const wordNewtype = (name: string): MidenTypeLayout => ({
  Struct: {
    name,
    size: 16,
    fields: [
      {
        name: "inner",
        ty: {
          Struct: {
            name: `${CORE_TYPES}/word`,
            size: 16,
            fields: ["a", "b", "c", "d"].map((name) => ({ name, ty: felt })),
          },
        },
      },
    ],
  },
});

// One of the four types the forms know: its name is enough.
const asset: MidenTypeLayout = {
  Struct: { name: `${CORE_TYPES}/asset`, size: 32 },
};

const noteIdx = feltNewtype(`${CORE_TYPES}/note-idx`);

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
          ["tag", "tag", feltNewtype(`${CORE_TYPES}/tag`)],
          ["note-type", "note-type", feltNewtype(`${CORE_TYPES}/note-type`)],
          ["recipient", "recipient", wordNewtype(`${CORE_TYPES}/recipient`)],
        ],
        [noteIdx],
      ),
      digest:
        "0x27641b79c8aec7ec29820c907eb5c05134b7d02cf69e7e73a5b7dcd09c803a95",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::wallets::basic_wallet::move_asset_to_note",
      ...signature([
        ["asset", "asset", asset],
        ["note-idx", "note-idx", noteIdx],
      ]),
      digest:
        "0xf261e7bdd1faee5db3b0abe4bb67b153fbca6ece3e456b83eff98697f21f6a97",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::wallets::basic_wallet::receive_asset",
      ...signature([["asset", "asset", asset]]),
      digest:
        "0xd7416b798a70aabbca510c3cd0f48ba35473b5d76dc302375157c6f563fffc15",
    },
  ],
};

export default basicWallet;
