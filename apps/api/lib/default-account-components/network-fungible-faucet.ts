import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const networkFungibleFaucet: Package = {
  ...defaultPackage(),
  id: "network-fungible-faucet",
  name: "network-fungible-faucet",
  type: "account",
  digest: "0x8443394f85a796bb5bb81791005dcf95e1f17de19a28b4171d32c06422940345",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::network_fungible_faucet::burn",
        digest:
          "0x3cf2fa0fec35c463ee28b80f719c80963582480a71d5ec3c9c461bb418ca988b",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::network_fungible_faucet::distribute",
        digest:
          "0x044be2b7eeb30d5ebc86ed30f12dae291b6949b651c59e3be3faa7d806a341c1",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::network_fungible_faucet::renounce_ownership",
        digest:
          "0x3c9099864baf02b957cb854ab08e3a74008eda24041f9fc60699491362355066",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::network_fungible_faucet::transfer_ownership",
        digest:
          "0x8bc3caaddcb7c29f4dc732d58b12fb65e14219fdc54cfaf460cca44c0e012375",
      },
    },
  ],
};

export default networkFungibleFaucet;
