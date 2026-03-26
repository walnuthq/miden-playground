import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const authFalcon512Rpo: Package = {
  ...defaultPackage(),
  id: "auth-falcon-512-rpo",
  name: "auth-falcon-512-rpo",
  type: "authentication-component",
  digest: "0xeb26a261a8b6eb80dfbd45a382d0cbd3601806f07ed2b200a15aa3b9ae317fd5",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::falcon_512_rpo::auth_tx_falcon512_rpo",
        digest:
          "0x55756031e881db5a6e360ab27890b8760949caa633976779381b28bbaf4cc9f0",
      },
    },
  ],
};

export default authFalcon512Rpo;
