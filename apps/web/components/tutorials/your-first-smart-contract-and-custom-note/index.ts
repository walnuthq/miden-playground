import type { Tutorial } from "@/lib/types/tutorial";
import { defaultTutorial } from "@/lib/utils/tutorial";
import { defaultState } from "@/lib/utils/state";
import Step1 from "@/components/tutorials/your-first-smart-contract-and-custom-note/step1";
import Step2 from "@/components/tutorials/your-first-smart-contract-and-custom-note/step2";
import Step3 from "@/components/tutorials/your-first-smart-contract-and-custom-note/step3";
import Step4 from "@/components/tutorials/your-first-smart-contract-and-custom-note/step4";
import Step5 from "@/components/tutorials/your-first-smart-contract-and-custom-note/step5";
import Step6 from "@/components/tutorials/your-first-smart-contract-and-custom-note/step6";
import Step7 from "@/components/tutorials/your-first-smart-contract-and-custom-note/step7";
import Step8 from "@/components/tutorials/your-first-smart-contract-and-custom-note/step8";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "your-first-smart-contract-and-custom-note",
  number: 11,
  title: "Your first Smart Contract and custom note",
  tagline: "Develop custom smart contracts and notes.",
  description:
    "In this tutorial, you'll create your first smart contract and understand the structure and implementation of both the counter account contract and increment note script.",
  category: "advanced",
  initialRoute: "/scripts",
  state: {
    ...defaultState(),
    tutorialId: "your-first-smart-contract-and-custom-note",
  },
  steps: [Step1, Step2, Step3, Step4, Step5, Step6, Step7, Step8],
};

export default tutorial;
