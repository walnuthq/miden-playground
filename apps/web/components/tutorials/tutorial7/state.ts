import { TEST_WALLET_ACCOUNT_ID, TEST_WALLET_ADDRESS } from "@/lib/constants";
import {
  basicWalletAccount,
  getIdentifierPart,
  getRoutingParametersPart,
} from "@/lib/types/account";
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
      identifier: getIdentifierPart(TEST_WALLET_ADDRESS),
      routingParameters: getRoutingParametersPart(TEST_WALLET_ADDRESS),
    },
  ],
  tutorialId: "timelock-p2id-note",
};

export default state;
