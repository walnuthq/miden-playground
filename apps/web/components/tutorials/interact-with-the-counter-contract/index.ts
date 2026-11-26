import state from "@/components/tutorials/interact-with-the-counter-contract/state";
import Step1 from "@/components/tutorials/interact-with-the-counter-contract/step1";
import Step2 from "@/components/tutorials/interact-with-the-counter-contract/step2";
import Step3 from "@/components/tutorials/interact-with-the-counter-contract/step3";
import Step4 from "@/components/tutorials/interact-with-the-counter-contract/step4";
import Step5 from "@/components/tutorials/interact-with-the-counter-contract/step5";
import Step6 from "@/components/tutorials/interact-with-the-counter-contract/step6";
import { tutorialMeta } from "@/components/tutorials/meta";
import type { Tutorial } from "@/lib/types/tutorial";
import {
  COUNTER_EXAMPLE_ID,
  counterExampleStarter,
} from "@/lib/utils/counter-example";
import { defaultTutorial } from "@/lib/utils/tutorial";

// The counter-account script isn't in the state: its package, built with debug
// info, is too big to embed (~530 KB of base64). The starter has the API
// compile the counter-contract example's packages and keeps the account
// component, the one the deployed counter (counterContractAddress) runs. It's
// read-only: the steps only read it, and an edited counter would no longer
// match the deployed one's code.
const tutorial: Tutorial = {
  ...defaultTutorial(),
  ...tutorialMeta("interact-with-the-counter-contract"),
  state,
  starter: async () => {
    const { scripts } = await counterExampleStarter({ readOnly: true });
    return {
      scripts: scripts.filter(({ name }) => name === COUNTER_EXAMPLE_ID),
    };
  },
  steps: [Step1, Step2, Step3, Step4, Step5, Step6],
};

export default tutorial;
