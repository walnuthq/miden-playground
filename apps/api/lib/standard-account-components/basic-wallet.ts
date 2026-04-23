import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const basicWallet: Package = {
  ...defaultPackage(),
  id: "basic-wallet",
  name: "basic-wallet",
  type: "account",
  digest: "0x284a73415341ff23381565be111550bc1c4f5c94cceec109f473a3dbf19ee030",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::wallets::basic_wallet::move_asset_to_note",
        digest:
          "0x6d30df4312a2c44ec842db1bee227cc045396ca91e2c47d756dcb607f2bf5f89",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::wallets::basic_wallet::receive_asset",
        digest:
          "0x75f638c65584d058542bcf4674b066ae394183021bc9b44dc2fdd97d52f9bcfb",
      },
    },
  ],
};

export default basicWallet;
