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
  digest: "0xd8df6042008eb01d7cde34332c8d46a6d89a3534827874e5c6746af46dac8639",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::no_auth::auth_no_auth",
        digest:
          "0x398fcf4e22884a9415f46bf84f9e2893a311944e32c83e50b2ce0ca3972149bb",
      },
    },
  ],
};

export default authNoAuth;
