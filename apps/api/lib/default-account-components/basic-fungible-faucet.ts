import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const basicFungibleFaucet: Package = {
  ...defaultPackage(),
  id: "basic-fungible-faucet",
  name: "basic-fungible-faucet",
  type: "account",
  digest: "0x0977096bca196ee5a05d7854579c6cd5056785aee2ed47eb654c561e20bcc253",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::basic_fungible_faucet::burn",
        digest:
          "0x3cf2fa0fec35c463ee28b80f719c80963582480a71d5ec3c9c461bb418ca988b",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::basic_fungible_faucet::distribute",
        digest:
          "0xd323717ca61e7fdc3eb4d26447c2fb2a73f20c52496ec550522ea14179f1340d",
      },
    },
  ],
};

export default basicFungibleFaucet;
