import { tutorialMeta } from "@/components/tutorials/meta";
import Step1 from "@/components/tutorials/your-first-smart-contract-and-custom-note/step1";
import Step2 from "@/components/tutorials/your-first-smart-contract-and-custom-note/step2";
import Step3 from "@/components/tutorials/your-first-smart-contract-and-custom-note/step3";
import Step4 from "@/components/tutorials/your-first-smart-contract-and-custom-note/step4";
import Step5 from "@/components/tutorials/your-first-smart-contract-and-custom-note/step5";
import Step6 from "@/components/tutorials/your-first-smart-contract-and-custom-note/step6";
import Step7 from "@/components/tutorials/your-first-smart-contract-and-custom-note/step7";
import Step8 from "@/components/tutorials/your-first-smart-contract-and-custom-note/step8";
import type { Tutorial } from "@/lib/types/tutorial";
import { midenFaucetAccount } from "@/lib/utils/account";
import { defaultState } from "@/lib/utils/state";
import { defaultTutorial } from "@/lib/utils/tutorial";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  ...tutorialMeta("your-first-smart-contract-and-custom-note"),
  state: {
    ...defaultState(),
    accounts: [midenFaucetAccount("mtst")],
    tutorialId: "your-first-smart-contract-and-custom-note",
  },
  steps: [Step1, Step2, Step3, Step4, Step5, Step6, Step7, Step8],
};

export default tutorial;
