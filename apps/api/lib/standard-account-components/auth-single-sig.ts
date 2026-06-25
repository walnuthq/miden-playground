import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const authSingleSig: Package = {
  ...defaultPackage(),
  id: "auth-single-sig",
  name: "auth-single-sig",
  type: "authentication-component",
  digest: "0xb3e910e90c3adc662a6c1f4860b9f310947bd1b9df52b462f2dc2096e9ce9593",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::singlesig::auth_tx",
        digest:
          "0x473c89421f456ed085930056bb0b9d84681e2fbdcf93789537e1907e29cd0ab2",
      },
    },
  ],
};

export default authSingleSig;
