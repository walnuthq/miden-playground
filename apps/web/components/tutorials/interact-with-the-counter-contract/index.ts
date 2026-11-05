import state from "@/components/tutorials/interact-with-the-counter-contract/state";
import Step1 from "@/components/tutorials/interact-with-the-counter-contract/step1";
import Step2 from "@/components/tutorials/interact-with-the-counter-contract/step2";
import Step3 from "@/components/tutorials/interact-with-the-counter-contract/step3";
import Step4 from "@/components/tutorials/interact-with-the-counter-contract/step4";
import Step5 from "@/components/tutorials/interact-with-the-counter-contract/step5";
import Step6 from "@/components/tutorials/interact-with-the-counter-contract/step6";
import { tutorialMeta } from "@/components/tutorials/meta";
import type { Tutorial } from "@/lib/types/tutorial";
import { defaultTutorial } from "@/lib/utils/tutorial";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  ...tutorialMeta("interact-with-the-counter-contract"),
  state,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6],
};

export default tutorial;
