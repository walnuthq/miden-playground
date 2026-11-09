import {
  basicWalletComponent,
  basicWalletScript,
} from "@/lib/tutorials/basic-wallet";
import defaultComponents from "@/lib/types/default-components";
import defaultScripts from "@/lib/types/default-scripts";
import type { State } from "@/lib/types/state";
import { midenFaucetAccount } from "@/lib/utils/account";
import { defaultState } from "@/lib/utils/state";

// The Rust basic wallet comes with the tutorial: the note script the user
// writes is compiled against it, and the Test Wallet that step 3 deploys
// carries its component, so that it can consume the note.
const state: State = {
  ...defaultState(),
  accounts: [midenFaucetAccount("mtst")],
  scripts: [...defaultScripts, basicWalletScript],
  components: [...defaultComponents, basicWalletComponent],
  tutorialId: "timelock-p2id-note",
};

export default state;
