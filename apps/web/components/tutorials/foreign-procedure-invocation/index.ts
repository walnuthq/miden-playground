import state from "@/components/tutorials/foreign-procedure-invocation/state";
import Step1 from "@/components/tutorials/foreign-procedure-invocation/step1";
import Step2 from "@/components/tutorials/foreign-procedure-invocation/step2";
import Step3 from "@/components/tutorials/foreign-procedure-invocation/step3";
import Step4 from "@/components/tutorials/foreign-procedure-invocation/step4";
import Step5 from "@/components/tutorials/foreign-procedure-invocation/step5";
import Step6 from "@/components/tutorials/foreign-procedure-invocation/step6";
import { tutorialMeta } from "@/components/tutorials/meta";
import type { Tutorial } from "@/lib/types/tutorial";
import { defaultTutorial } from "@/lib/utils/tutorial";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  ...tutorialMeta("foreign-procedure-invocation"),
  state,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6],
};

export default tutorial;
