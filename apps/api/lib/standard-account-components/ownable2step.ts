import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const ownable2Step: Package = {
  ...defaultPackage(),
  id: "ownable2step",
  name: "ownable2step",
  type: "account",
  digest: "0xf824343001efd816ef0733088543c74f1269f4bbd36051a807838f48e22c69e9",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::access::ownable2step::accept_ownership",
        digest:
          "0x030eb91c5469efea70b8ce24dbd16a6aa787e423343e835e69c022d46eed72e4",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::access::ownable2step::get_nominated_owner",
        digest:
          "0x9df003d35f852dbf49b0f994299cee2eca4935f7604b801532ae2d5f58948164",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::access::ownable2step::get_owner",
        digest:
          "0x47d8823c8d2d0bd06cb1fcd8e78e3fd82970549d28a1674b1d147c55e7520ed6",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::access::ownable2step::renounce_ownership",
        digest:
          "0xa9a147c389930b1d319970fefb60f3aabb8f9f907d409656356d0c9f6a3a9269",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::access::ownable2step::transfer_ownership",
        digest:
          "0x9764e19c5973a9ea55d3edde42069ecd025a38b10c335d62f3f375560d339f15",
      },
    },
  ],
};

export default ownable2Step;
