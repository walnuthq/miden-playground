import defaultScripts from "@/lib/types/default-scripts";
import type { State } from "@/lib/types/state";
import { midenFaucetAccount } from "@/lib/utils/account";
import { defaultState } from "@/lib/utils/state";

// The counter the user imports in step 4 (counterContractAddress) is an
// instance of the counter-account package the tutorial's starter adds
// (index.ts): importing it is what the tutorial teaches, so no account is
// pre-imported. The import matches the account code's procedure digests
// against the workspace's scripts to list it as a component.
const state: State = {
  ...defaultState(),
  accounts: [midenFaucetAccount("mtst")],
  scripts: defaultScripts,
  tutorialId: "interact-with-the-counter-contract",
};

export default state;
