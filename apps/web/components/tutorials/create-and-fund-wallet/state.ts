import { initialState, type State } from "@/components/global-context/reducer";

const state: State = {
  ...initialState(),
  networkId: "mlcl",
  blockNum: 5,
  accounts: [
    {
      id: "0xc0321051742c4e203ff6fd1f830a7a",
      name: "MDN Faucet",
      address: "mlcl1qrqryyz3wskyugpl7m73lqc20g475xsr",
      type: "Fungible faucet (token symbol: MDN)",
      storageMode: "Public",
      isPublic: true,
      isFaucet: true,
      nonce: 0n,
      fungibleAssets: [],
      storage: [
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0xb2be0868e8f541d7f813e390100e9961bc41bd698956ac8a959a7b87cf56917a",
        "0x40420f0000000000080000000000000021410300000000000000000000000000",
      ],
      consumableNoteIds: [],
      components: [],
      tokenSymbol: "MDN",
      updatedAt: 5,
    },
  ],
  tutorialId: "create-and-fund-wallet",
};

export default state;
