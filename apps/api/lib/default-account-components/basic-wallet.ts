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
  digest: "0xc45592b272266a4601d30484643b1df7a9e4c0b2306fef126e8e686234554603",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::basic_wallet::move_asset_to_note",
        digest:
          "0x0e406b067ed2bcd7de745ca6517f519fd1a9be245f913347ac673ca1db30c1d6",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::basic_wallet::receive_asset",
        digest:
          "0x6f4bdbdc4b13d7ed933d590d88ac9dfb98020c9e917697845b5e169395b76a01",
      },
    },
  ],
};

export default basicWallet;
