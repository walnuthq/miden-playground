import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const networkFungibleFaucet: Package = {
  ...defaultPackage(),
  id: "network-fungible-faucet",
  name: "network-fungible-faucet",
  type: "account",
  digest: "0x94b171b4b25fbe0348941dbd651d9dea37089f3a6414523193617765e24f6c1f",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::network_fungible_faucet::burn",
        digest:
          "0xe691b954bc9474baae6948b176642f425ea166970003fcf5666b1e4aa6af5257",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::network_fungible_faucet::mint_and_send",
        digest:
          "0xa3a25ccb1bfa64487fd7dc7e516f8b042d2144f4300a3ddbc0063294e1e92762",
      },
    },
  ],
};

export default networkFungibleFaucet;
