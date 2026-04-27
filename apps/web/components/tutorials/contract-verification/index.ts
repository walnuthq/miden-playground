import type { Tutorial } from "@/lib/types/tutorial";
import { defaultTutorial } from "@/lib/utils/tutorial";
import { defaultState } from "@/lib/utils/state";
import Step1 from "@/components/tutorials/contract-verification/step1";
import Step2 from "@/components/tutorials/contract-verification/step2";
import Step3 from "@/components/tutorials/contract-verification/step3";
import Step4 from "@/components/tutorials/contract-verification/step4";
import Step5 from "@/components/tutorials/contract-verification/step5";
import Step6 from "@/components/tutorials/contract-verification/step6";
import Step7 from "@/components/tutorials/contract-verification/step7";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "contract-verification",
  number: 12,
  title: "Contract verification",
  tagline: "Deploy and verify custom smart contracts on-chain.",
  description:
    "In this tutorial we learn how to develop custom Miden contracts, deploy them on-chain, and verify them using the Miden playground.",
  category: "advanced",
  initialRoute: "/scripts",
  state: {
    ...defaultState(),
    tutorialId: "contract-verification",
  },
  steps: [Step1, Step2, Step3, Step4, Step5, Step6, Step7],
};

export default tutorial;
