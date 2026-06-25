import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const fungibleFaucet: Package = {
  ...defaultPackage(),
  id: "fungible-faucet",
  name: "fungible-faucet",
  type: "account",
  digest: "0x3ca7e678c18301868e5a9f1eb4d786d56b7644ad8e76408a6068e16edd219901",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::get_decimals",
        digest:
          "0xa33660e0deb627d359e00c908ce054b9462089a6c37b833449d6d77513a3a913",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::get_max_supply",
        digest:
          "0x527c6ad749ef921452fe97e90e4bc843a8a4789d7174f7bf5e7c0a54578fe6ac",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::get_mutability_config",
        digest:
          "0xda819ca1b89c0a4c70871336ac0bef3588a7844103dd1bd08b6d2344470dd490",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::get_name",
        digest:
          "0x13244f785e2fb651b4156d7a21b3fb52415b41f6963c25d8431676a1c378a8e4",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::get_token_config",
        digest:
          "0x808abad5d4e72d851f6502a971347af135977bd01f49ce92987929fac58555ee",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::get_token_supply",
        digest:
          "0xaec92c20aff950acb3f22e93012f06ab0410b1e735f7cd5e6b89069991a02446",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::get_token_symbol",
        digest:
          "0xf05890f924db20842991413aa05a147347d13a6c1025dc0201be34d346aedd02",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::is_description_mutable",
        digest:
          "0x8e961e99f376d0883dd3ae725cf72adc2587c41833533dfc2142ef85aa88d703",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::is_external_link_mutable",
        digest:
          "0xb5218afa1f79d6c01f65c85cef44da974ce2c6205d8af977b05a66571eec41a8",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::is_logo_uri_mutable",
        digest:
          "0x50fbb4d38c9b69a5cf1dce1c1fc90ba283cdbfba2b218b4ef1bb17f0c06c4795",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::is_max_supply_mutable",
        digest:
          "0xfc300a73d9714d0b833f0e369fafc7a005b9cae5a5af5f41f1e8b7ea9d0a969d",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::mint_and_send",
        digest:
          "0x652806c9b3aaeffa7192bafaabb5233b594d1cbe4c34e54bcf0e933335353b77",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::receive_and_burn",
        digest:
          "0xe5f86a4535d59512396861f069ec3aca6a0e0497d2c1ce189538609d294da985",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::set_description",
        digest:
          "0x6f18b00fc65c7bbaf1ea6321d8a69e0638a6d297216afb0210e5e960bb95949b",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::set_external_link",
        digest:
          "0x961d9d88455808a8240dc51ac6c747b1908ada0f114a2d5bffe17a336d76fb26",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::set_logo_uri",
        digest:
          "0x1ee067f2fcafb72cb1453eb5f12a26ef983640cbfe307b6eaa31faf85f4e8759",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::fungible_faucet::set_max_supply",
        digest:
          "0x51099fa3950b5d07a2373a1b22b5bc99c9de2bee7e1a8851ab0631a3e40771c9",
      },
    },
  ],
};

export default fungibleFaucet;
