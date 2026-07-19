import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const basicWallet: Package = {
  ...defaultPackage(),
  id: "basic-wallet",
  name: "basic-wallet",
  type: "account-component",
  digest: "0x2d3dd7b37c470013f64bb7dce356cea29471f10fa35f04405452c0c59f53dc20",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::wallets::basic_wallet::move_asset_to_note",
        digest:
          "0xfb1c73d10de1954e9e8948964e3e77cf4e33759d2e012cb00eb10c50f2974eb4",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::wallets::basic_wallet::receive_asset",
        digest:
          "0x6170fd6d682d91777b551fd866258f43cc657f1291f8f071500f4e56e9c153da",
      },
    },
  ],
};

export default basicWallet;
