import type { Tutorial } from "@/lib/types/tutorial";
import { defaultTutorial } from "@/lib/utils/tutorial";
import { defaultState } from "@/lib/utils/state";
import { midenFaucetAccount } from "@/lib/utils/account";
import Step1 from "@/components/tutorials/deploy-a-counter-contract/step1";
import Step2 from "@/components/tutorials/deploy-a-counter-contract/step2";
import Step3 from "@/components/tutorials/deploy-a-counter-contract/step3";
import Step4 from "@/components/tutorials/deploy-a-counter-contract/step4";
import Step5 from "@/components/tutorials/deploy-a-counter-contract/step5";
import Step6 from "@/components/tutorials/deploy-a-counter-contract/step6";
import Step7 from "@/components/tutorials/deploy-a-counter-contract/step7";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "deploy-a-counter-contract",
  number: 7,
  title: "Deploy a counter contract",
  tagline: "Deploy your own counter contract on testnet.",
  description:
    "In this tutorial, you'll write your own counter contract, deploy it on testnet and increment its counter.",
  category: "advanced",
  initialRoute: "/scripts",
  state: {
    ...defaultState(),
    accounts: [midenFaucetAccount("mtst")],
    tutorialId: "deploy-a-counter-contract",
  },
  steps: [Step1, Step2, Step3, Step4, Step5, Step6, Step7],
};

export default tutorial;
