import defaultScripts from "@/lib/types/default-scripts";
import type { State } from "@/lib/types/state";
import { midenFaucetAccount } from "@/lib/utils/account";
import { defaultState } from "@/lib/utils/state";

// The Rust basic wallet that came with the tutorial was deleted at the
// switch to MASM: a MASM note calls the standard wallet's `receive_asset`,
// which the built-in Basic Wallet has. The tutorial is unavailable until
// plan 07 of spec/remove-rust rewrites it.
const state: State = {
  ...defaultState(),
  accounts: [midenFaucetAccount("mtst")],
  scripts: defaultScripts,
  tutorialId: "timelock-p2id-note",
};

export default state;
