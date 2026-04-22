import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const authNoAuth: Package = {
  ...defaultPackage(),
  id: "auth-no-auth",
  name: "auth-no-auth",
  type: "authentication-component",
  digest: "0xdcc744a24dfa37ae9c7826267102a0fa7a081c28d2e1bfbd3784cbc6a7f0fa0e",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::no_auth::auth_no_auth",
        digest:
          "0xd5dbddf4f755c4b7787de8df59da61dc15d4c1bef45541e8c043e11345703ef1",
      },
    },
  ],
};

export default authNoAuth;
