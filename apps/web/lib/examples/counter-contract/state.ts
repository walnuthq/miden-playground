import { counterAccountComponent } from "@/lib/tutorials/counter-account";
import defaultComponents from "@/lib/types/default-components";
import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";

const state: State = {
  ...defaultState(),
  exampleId: "counter-account",
  components: [
    ...defaultComponents,
    // Its script is created from the API when the example is launched
    // (useExamples), which fills `scriptId` in.
    { ...counterAccountComponent, scriptId: "" },
  ],
};

export default state;
