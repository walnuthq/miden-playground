import { tutorialMeta } from "@/components/tutorials/meta";
import state from "@/components/tutorials/timelock-p2id-note/state";
import Step1 from "@/components/tutorials/timelock-p2id-note/step1";
import Step2 from "@/components/tutorials/timelock-p2id-note/step2";
import Step3 from "@/components/tutorials/timelock-p2id-note/step3";
import Step4 from "@/components/tutorials/timelock-p2id-note/step4";
import Step5 from "@/components/tutorials/timelock-p2id-note/step5";
import type { Tutorial } from "@/lib/types/tutorial";
import { defaultTutorial } from "@/lib/utils/tutorial";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  ...tutorialMeta("timelock-p2id-note"),
  state,
  steps: [Step1, Step2, Step3, Step4, Step5],
};

export default tutorial;
