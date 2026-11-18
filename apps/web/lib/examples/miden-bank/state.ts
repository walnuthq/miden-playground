import type { State } from "@/lib/types/state";
import { midenFaucetAccount } from "@/lib/utils/account";
import { defaultState } from "@/lib/utils/state";

// Its scripts are created from the API when the example is launched
// (useExamples).
const state: State = {
  ...defaultState(),
  exampleId: "bank-account",
  accounts: [midenFaucetAccount("mtst")],
};

export default state;
