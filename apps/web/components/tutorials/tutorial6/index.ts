import { defaultTutorial, type Tutorial } from "@/lib/types/tutorial";
import state from "@/components/tutorials/tutorial6/state";
import Step1 from "@/components/tutorials/tutorial6/step1";
import Step2 from "@/components/tutorials/tutorial6/step2";
import Step3 from "@/components/tutorials/tutorial6/step3";
import Step4 from "@/components/tutorials/tutorial6/step4";
import Step5 from "@/components/tutorials/tutorial6/step5";
import Step6 from "@/components/tutorials/tutorial6/step6";
import Step7 from "@/components/tutorials/tutorial6/step7";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "deploy-a-counter-contract",
  number: 6,
  title: "Deploy a Counter Contract",
  tagline: "Deploy your own Counter Contract on testnet.",
  description:
    "This tutorial will walk you through developing your own custom Counter Contract and deploying it on testnet.",
  category: "advanced",
  initialRoute: "/scripts",
  state,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6, Step7],
};

export default tutorial;
