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
  digest: "0xfe54a81601e737e864f985df8008ef8575011539e7da6f3f7ad18bd44397fae7",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::singlesig_acl::auth_tx_acl",
        digest:
          "0x001677d050e871cbfae0250ea62b9375ee1a9e478754403c0e3216fd23fe9304",
      },
    },
  ],
};

export default authSingleSigAcl;
