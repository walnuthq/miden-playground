import defaultScripts from "@/lib/types/default-scripts";
import type { State } from "@/lib/types/state";
import { midenFaucetAccount } from "@/lib/utils/account";
import { defaultState } from "@/lib/utils/state";

// The built-in scripts: step 3 deploys the Test Wallet with the No Auth and
// Basic Wallet components, the standard wallet's `receive_asset` that the
// P2ID note calls.
const state: State = {
  ...defaultState(),
  accounts: [midenFaucetAccount("mtst")],
  scripts: defaultScripts,
  tutorialId: "timelock-p2id-note",
};

export default state;
