import { type State, initialState } from "@/components/global-context/reducer";

const state: State = {
  ...initialState(),
  networkId: "mlcl",
  blockNum: 5,
  accounts: [
    {
      id: "0xba3a0e16c7e40c101530f4dee90021",
      name: "Wallet A",
      address: "mlcl1qzar5rskcljqcyq4xr6da6gqyyfxkzhr",
      type: "Regular (updatable)",
      storageMode: "Public",
      isPublic: true,
      isFaucet: false,
      nonce: 0n,
      fungibleAssets: [],
      storage: [
        "0xd0f7da0732624c386ef671ed63e93fd7a352acff5e100bfb4d3ae01759d379ac",
      ],
      consumableNoteIds: [],
      components: [],
      tokenSymbol: "",
      updatedAt: 5,
    },
    {
      id: "0xee6eb127545609106beb3fb0a8e8c5",
      name: "Wallet B",
      address: "mlcl1qrhxavf823tqjyrtavlmp28gc5tzwz3c",
      type: "Regular (updatable)",
      storageMode: "Public",
      isPublic: true,
      isFaucet: false,
      nonce: 0n,
      fungibleAssets: [],
      storage: [
        "0x659320bae5987df1fe549a20e5066785a3bcbb99218164948214690e88b31b9a",
      ],
      consumableNoteIds: [],
      components: [],
      tokenSymbol: "",
      updatedAt: 5,
    },
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
  tutorialId: "transfer-assets-between-wallets",
};

export default state;
