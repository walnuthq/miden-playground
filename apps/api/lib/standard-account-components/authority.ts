import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const authority: Package = {
  ...defaultPackage(),
  id: "authority",
  name: "authority",
  type: "account-component",
  digest: "0xe2fa4c774948a09ff77ad89f46757ace8f2695eb1c0499450d6ed9c60e208228",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::access::authority::get_authority",
        digest:
          "0xf486ab096853ce94b8a54861f41d73f6dc26fc42ddf86a57930b5dcbac709098",
      },
    },
  ],
};

export default authority;
