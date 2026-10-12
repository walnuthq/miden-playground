import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";
import { midenFaucetAccount } from "@/lib/utils/account";

const state: State = {
  ...defaultState(),
  accounts: [midenFaucetAccount("mtst")],
  tutorialId: "timelock-p2id-note",
};

export default state;
