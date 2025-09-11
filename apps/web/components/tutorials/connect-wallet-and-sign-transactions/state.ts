import { type State, initialState } from "@/components/global-context/reducer";
import { MIDEN_FAUCET_ACCOUNT_ID, MIDEN_FAUCET_ADDRESS } from "@/lib/constants";

const state: State = {
  ...initialState(),
  networkId: "mtst",
  accounts: [
    {
      id: MIDEN_FAUCET_ACCOUNT_ID,
      name: "Miden Faucet",
      address: MIDEN_FAUCET_ADDRESS,
      type: "fungible-faucet",
      storageMode: "public",
      isPublic: true,
      isFaucet: true,
      nonce: 681n,
      fungibleAssets: [],
      storage: [
        "0x000000000000000000000000000000000000000000000000642b924c27010000",
        "0x082ee6e010d11ecb3a25b5282fcecc835af536bc8346880069dc61df05bbeef6",
        "0x00008a5d784563010600000000000000df2db808000000000000000000000000",
      ],
      consumableNoteIds: [],
      components: [],
      updatedAt: 0,
    },
  ],
  tutorialId: "connect-wallet-and-sign-transactions",
};

export default state;
