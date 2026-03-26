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
  digest: "0xe9ee054ffeb3bd22bc4f0a4778960ec8e3571b0a0c8299bfed0cdb5d156686b7",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::no_auth::auth_no_auth",
        digest:
          "0x00498108f0eae0e35deadd489892062338c3d55772635d0b133f0bdf2980bf64",
      },
    },
  ],
};

export default authNoAuth;
