import { initialState, type State } from "@/components/global-context/reducer";

const state: State = {
  ...initialState(),
  networkId: "mlcl",
  blockNum: 0,
  accounts: [
    {
      id: "0xa10ee8de0c4519207a3c23e3a928ad",
      name: "MDN Faucet",
      address: "mlcl1qzssa6x7p3z3jgr68s3782fg44cqzaezm5v",
      type: "fungible-faucet",
      storageMode: "public",
      isPublic: true,
      isFaucet: true,
      nonce: 0n,
      fungibleAssets: [],
      storage: [
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x9834b7f69960a4bdc40196cabaa2fd3e800637c0926b5d23298f8d934d2677af",
        "0x40420f0000000000080000000000000021410300000000000000000000000000",
      ],
      consumableNoteIds: [],
      components: [],
      tokenSymbol: "MDN",
      updatedAt: 0,
    },
  ],
  tutorialId: "create-and-fund-wallet",
};

export default state;
