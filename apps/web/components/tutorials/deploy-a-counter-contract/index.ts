import Step1 from "@/components/tutorials/deploy-a-counter-contract/step1";
import Step2 from "@/components/tutorials/deploy-a-counter-contract/step2";
import Step3 from "@/components/tutorials/deploy-a-counter-contract/step3";
import Step4 from "@/components/tutorials/deploy-a-counter-contract/step4";
import Step5 from "@/components/tutorials/deploy-a-counter-contract/step5";
import Step6 from "@/components/tutorials/deploy-a-counter-contract/step6";
import Step7 from "@/components/tutorials/deploy-a-counter-contract/step7";
import { tutorialMeta } from "@/components/tutorials/meta";
import type { Tutorial } from "@/lib/types/tutorial";
import { midenFaucetAccount } from "@/lib/utils/account";
import { defaultState } from "@/lib/utils/state";
import { defaultTutorial } from "@/lib/utils/tutorial";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  ...tutorialMeta("deploy-a-counter-contract"),
  state: {
    ...defaultState(),
    accounts: [midenFaucetAccount("mtst")],
    tutorialId: "deploy-a-counter-contract",
  },
  steps: [Step1, Step2, Step3, Step4, Step5, Step6, Step7],
};

export default tutorial;
