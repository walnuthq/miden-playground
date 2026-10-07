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
  digest: "0xa93f46f604b8c6b9896f18d5d6fc191f5bc3d03d20f4b6c315bd74d5c21b9011",
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::get_decimals",
      digest:
        "0x4c044331e53b8e73f41c0fc3b7062aae9d1fbba992fab6f7712b4e57eba2f00a",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::get_max_supply",
      digest:
        "0xbadfef39d5fa02a6265396ebe78a100812101c9ae4157b42c47c5538c9ffa358",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::get_mutability_config",
      digest:
        "0x13765f07d07d6d1678c1e6460c095594fee87f1aaec0a9887cf50cd106490746",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::get_name",
      digest:
        "0x8841f58fd93a421ff55b7f24795f564b3b05b09776d8b69336f2b9d9dc8d9886",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::get_token_config",
      digest:
        "0xbd962fe14d6d47cc3741f23c4fb085c74b3d253db27617d711d13f37a416c991",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::get_token_supply",
      digest:
        "0x35a0ce33a5522830cafc949508db51758f4c0ac991926e87a8a3857509e47002",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::get_token_symbol",
      digest:
        "0xb6930e1958d4260af1eea7d05077511e744e0c5e273fa5e219ab98523c674107",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::has_procedure",
      digest:
        "0x97a695d6dbe6f5d87fdf3826945cf87c0d888e59ba1519c3d4367571d7a46fc2",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::is_description_mutable",
      digest:
        "0xc88b05401001101e0902602fbf0efd22559ed1d00b77432e9ae4a885dbf8ac32",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::is_external_link_mutable",
      digest:
        "0x07df237d515ebd1db5bff9ae56ad83bca3d6550bffaa026547f3c25cedece5af",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::is_logo_uri_mutable",
      digest:
        "0x870ef2b9f8ab83a24d7ecb90622ab0b8bef804f260275566075731ab22373f0a",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::is_max_supply_mutable",
      digest:
        "0x9cd2854d86fe9fb70ce75b9b7a30b9ccb243ef7858e64119936dd5137d0f425c",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::mint_and_send",
      digest:
        "0xe1dcc10a7548a5de04a84bd7948679b835e1f10bf2a9ac4d457c4ab37281c848",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::receive_and_burn",
      digest:
        "0xc25b7e98c43dbea9a2d0fb143e1ea208d3182736333c8398d07ecff9f02c7266",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::set_description",
      digest:
        "0x470196a3ff2e14cae18a7d68c20c8cf78093c658cca1520113527581ce4282b0",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::set_external_link",
      digest:
        "0x1ce270061896646a1f7ef1d166d438e6f0dcd43ea68c3a83cc72102a10877878",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::set_logo_uri",
      digest:
        "0x08c4fa602750fd872d144ec5b6dd0a84586fa841b8cb40201e400a99b68b550f",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::faucets::fungible_faucet::set_max_supply",
      digest:
        "0x330e4c8c11d109d878cdb2bbce35f03f17098efd8476e1851f667c4e2b499498",
    },
  ],
};

export default fungibleFaucet;
