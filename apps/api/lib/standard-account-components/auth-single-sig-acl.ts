import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const authSingleSigAcl: Package = {
  ...defaultPackage(),
  id: "auth-single-sig-acl",
  name: "auth-single-sig-acl",
  type: "authentication-component",
  digest: "0x58f07428d77c78567e0e4aeca8e4a3a7b8457d8de74ac2994ff0c526da0d1228",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::singlesig_acl::auth_tx_acl",
        digest:
          "0x75be2837b1643fd63eb46ebbaf90ba037c2bf9edba57be48e134605935071a7b",
      },
    },
  ],
};

export default authSingleSigAcl;
