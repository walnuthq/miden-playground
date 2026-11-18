import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";

// Its scripts are created from the API when the example is launched
// (useExamples).
const state: State = {
  ...defaultState(),
  exampleId: "counter-account",
};

export default state;
