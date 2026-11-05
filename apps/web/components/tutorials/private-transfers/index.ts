import { tutorialMeta } from "@/components/tutorials/meta";
import Step1 from "@/components/tutorials/private-transfers/step1";
import Step2 from "@/components/tutorials/private-transfers/step2";
import Step3 from "@/components/tutorials/private-transfers/step3";
import Step4 from "@/components/tutorials/private-transfers/step4";
import Step5 from "@/components/tutorials/private-transfers/step5";
import Step6 from "@/components/tutorials/private-transfers/step6";
import type { Tutorial } from "@/lib/types/tutorial";
import { midenFaucetAccount } from "@/lib/utils/account";
import { defaultState } from "@/lib/utils/state";
import { defaultTutorial } from "@/lib/utils/tutorial";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  ...tutorialMeta("private-transfers"),
  state: {
    ...defaultState(),
    accounts: [midenFaucetAccount("mtst")],
    tutorialId: "private-transfers",
  },
  steps: [Step1, Step2, Step3, Step4, Step5, Step6],
};

export default tutorial;
