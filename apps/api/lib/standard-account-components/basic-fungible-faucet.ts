import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const basicFungibleFaucet: Package = {
  ...defaultPackage(),
  id: "basic-fungible-faucet",
  name: "basic-fungible-faucet",
  type: "account",
  digest: "0x59f4f46d113f05821999e9c7721f299639338f586325daa2ee9d0e2c7fe1e899",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::basic_fungible_faucet::burn",
        digest:
          "0xe691b954bc9474baae6948b176642f425ea166970003fcf5666b1e4aa6af5257",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::basic_fungible_faucet::mint_and_send",
        digest:
          "0x1a36b822da3f4fc13b08a2865c8c252658ebb04ea721ad31173e2a01850ec6f3",
      },
    },
  ],
};

export default basicFungibleFaucet;
