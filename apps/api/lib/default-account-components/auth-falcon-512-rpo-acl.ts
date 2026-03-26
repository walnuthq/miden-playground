import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const authFalcon512RpoAcl: Package = {
  ...defaultPackage(),
  id: "auth-falcon-512-rpo-acl",
  name: "auth-falcon-512-rpo-acl",
  type: "authentication-component",
  digest: "0xe9a9107ca075113dfb62b3aa586fa1d92b7721331e978f1b3c009800c3b43f43",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::falcon_512_rpo_acl::auth_tx_falcon512_rpo_acl",
        digest:
          "0x260888f7d1653a4e43b0a2ac11fd6562218290b769bd54839a2e06a82b78a7a2",
      },
    },
  ],
};

export default authFalcon512RpoAcl;
