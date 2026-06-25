import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const authNetworkAccount: Package = {
  ...defaultPackage(),
  id: "auth-network-account",
  name: "auth-network-account",
  type: "authentication-component",
  digest: "0xd11852ac8afc34bd194e01937ac25005a67134fe45606789504e519c0abefaca",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::network_account::auth_network_transaction",
        digest:
          "0xc12187a6bf7a0597b7d4feba6521c767ebda2a21c02cdfdef8a4585334df7a23",
      },
    },
  ],
};

export default authNetworkAccount;
