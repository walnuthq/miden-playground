import defaultScripts from "@/lib/types/default-scripts";
import type { State } from "@/lib/types/state";
import { midenFaucetAccount } from "@/lib/utils/account";
import { defaultState } from "@/lib/utils/state";

// The counter the user imports in step 4 (counterContractAddress) is an
// instance of this package: importing it is what the tutorial teaches, so no
// account is pre-imported. The script's name must stay `counter-account`:
// the account code's procedure digests depend on the package name, and the
// import matches them against the workspace's scripts to list it as a
// component.
// The embedded Rust package it started with was deleted at the switch to
// MASM: the tutorial is unavailable until plan 07 of spec/remove-rust
// rewrites it, re-embedding the package from MASM or assembling it on demand.
const state: State = {
  ...defaultState(),
  accounts: [midenFaucetAccount("mtst")],
  scripts: defaultScripts,
  tutorialId: "interact-with-the-counter-contract",
};

export default state;
