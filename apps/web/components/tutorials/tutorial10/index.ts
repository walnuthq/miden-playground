import { defaultTutorial, type Tutorial } from "@/lib/types/tutorial";
import { defaultStore } from "@/lib/types/store";
import state from "@/components/tutorials/tutorial10/state";
import Step1 from "@/components/tutorials/tutorial10/step1";
import Step2 from "@/components/tutorials/tutorial10/step2";
import Step3 from "@/components/tutorials/tutorial10/step3";
import Step4 from "@/components/tutorials/tutorial10/step4";
import Step5 from "@/components/tutorials/tutorial10/step5";
import Step6 from "@/components/tutorials/tutorial10/step6";
import Step7 from "@/components/tutorials/tutorial10/step7";
import Step8 from "@/components/tutorials/tutorial10/step8";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "your-first-smart-contract-and-custom-note",
  number: 10,
  title: "Your first Smart Contract and custom note",
  tagline: "Develop custom smart contracts and notes.",
  description:
    "In this tutorial, you'll create your first smart contract and understand the structure and implementation of both the counter account contract and increment note script.",
  category: "advanced",
  initialRoute: "/scripts",
  store: defaultStore(),
  state,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6, Step7, Step8],
};

export default tutorial;
