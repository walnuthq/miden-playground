import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const authSingleSig: Package = {
  ...defaultPackage(),
  id: "auth-singlesig",
  name: "auth-singlesig",
  type: "authentication-component",
  digest: "0x8e3520920017c0332f216fc5cc2ccdcff81f9d4fce2892de2dfad67a71092898",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::singlesig::auth_tx",
        digest:
          "0x92da8dad708417474b787887cc149837b1f960d9888080bf60f532c2a8f66a19",
      },
    },
  ],
};

export default authSingleSig;
