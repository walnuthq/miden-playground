import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";
import { testWalletAccountId, testWalletAddress } from "@/lib/constants";
import {
  basicWalletAccount,
  getIdentifierPart,
  getRoutingParametersPart,
  midenFaucetAccount,
} from "@/lib/utils/account";

const state: State = {
  ...defaultState(),
  accounts: [
    midenFaucetAccount("mtst"),
    {
      ...basicWalletAccount({ storageMode: "public" }),
      id: testWalletAccountId("mtst"),
      name: "Test Wallet",
      address: testWalletAddress("mtst"),
      identifier: getIdentifierPart(testWalletAddress("mtst")),
      routingParameters: getRoutingParametersPart(testWalletAddress("mtst")),
      isNew: false,
    },
  ],
  tutorialId: "timelock-p2id-note",
};

export default state;
