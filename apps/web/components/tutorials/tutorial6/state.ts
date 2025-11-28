import { TEST_WALLET_ACCOUNT_ID, TEST_WALLET_ADDRESS } from "@/lib/constants";
import { basicWalletAccount } from "@/lib/types/account";
import { type State, defaultState } from "@/lib/types/state";

const state: State = {
  ...defaultState(),
  networkId: "mtst",
  accounts: [
    {
      ...basicWalletAccount({ storageMode: "public" }),
      id: TEST_WALLET_ACCOUNT_ID,
      name: "Test Wallet",
      address: TEST_WALLET_ADDRESS,
    },
  ],
  tutorialId: "timelock-p2id-note",
};

export default state;
