import type { Script } from "@/lib/types/script";
import { defaultProcedureExport, defaultScript } from "@/lib/utils/script";

export const rust = "";

export const masm = `# The MASM code of the Basic Fungible Faucet Account Component.
#
# See the \`BasicFungibleFaucet\` Rust type's documentation for more details.

pub use ::miden::standards::faucets::basic_fungible::mint_and_send
pub use ::miden::standards::faucets::basic_fungible::burn
`;

const fungibleFaucet: Script = {
  ...defaultScript(),
  id: "fungible-faucet",
  name: "fungible-faucet",
  type: "account-component",
  status: "compiled",
  readOnly: true,
  rust,
  masm,
  digest: "0xafa15a803c5717efff1c00fafd997fe1ae902604a4a1464985b0107354cfa480",
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::get_decimals",
      digest:
        "0xa33660e0deb627d359e00c908ce054b9462089a6c37b833449d6d77513a3a913",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::get_max_supply",
      digest:
        "0x527c6ad749ef921452fe97e90e4bc843a8a4789d7174f7bf5e7c0a54578fe6ac",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::get_mutability_config",
      digest:
        "0xda819ca1b89c0a4c70871336ac0bef3588a7844103dd1bd08b6d2344470dd490",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::get_name",
      digest:
        "0x13244f785e2fb651b4156d7a21b3fb52415b41f6963c25d8431676a1c378a8e4",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::get_token_config",
      digest:
        "0x808abad5d4e72d851f6502a971347af135977bd01f49ce92987929fac58555ee",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::get_token_supply",
      digest:
        "0xaec92c20aff950acb3f22e93012f06ab0410b1e735f7cd5e6b89069991a02446",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::get_token_symbol",
      digest:
        "0xf05890f924db20842991413aa05a147347d13a6c1025dc0201be34d346aedd02",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::has_procedure",
      digest:
        "0x0b86f18d6873e91dfbe6e82e1701b7f37d351c07edf57abb92b45958cbb5cce2",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::is_description_mutable",
      digest:
        "0x8e961e99f376d0883dd3ae725cf72adc2587c41833533dfc2142ef85aa88d703",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::is_external_link_mutable",
      digest:
        "0xb5218afa1f79d6c01f65c85cef44da974ce2c6205d8af977b05a66571eec41a8",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::is_logo_uri_mutable",
      digest:
        "0x50fbb4d38c9b69a5cf1dce1c1fc90ba283cdbfba2b218b4ef1bb17f0c06c4795",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::is_max_supply_mutable",
      digest:
        "0xfc300a73d9714d0b833f0e369fafc7a005b9cae5a5af5f41f1e8b7ea9d0a969d",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::mint_and_send",
      digest:
        "0xd52c7f7ce1fa79da18fa9f1bef3af8ca122cfa8fe5a820293e204e02e4f7c594",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::receive_and_burn",
      digest:
        "0x43f78c2fa15ec0c404cfe4442a5551a1ae301b93caa3afd8b8f106fe06de6f55",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::set_description",
      digest:
        "0xc828574dbd80a229eb9987e62c4ecd2e2e2215dbadcca16e10fe5f934a158f0b",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::set_external_link",
      digest:
        "0x7a4343b5f60c256ae78d1e6cd52ecb428895625d442b894d4d3b1f32c699cc0c",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::set_logo_uri",
      digest:
        "0x3956ab640c1d2b3866b6e8356401677003e6807b7106aeac8129365c5e134634",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::set_max_supply",
      digest:
        "0x943b448eb81865f8dc52b24cfb8f654d5da0adc56144290f8af11c3b098f1778",
    },
  ],
};

export default fungibleFaucet;
