import { type Tutorial } from "@/lib/types/tutorial";
import store from "@/components/tutorials/deploy-a-counter-contract/store";
import state from "@/components/tutorials/deploy-a-counter-contract/state";
import Step1 from "@/components/tutorials/deploy-a-counter-contract/step1";
import Step2 from "@/components/tutorials/deploy-a-counter-contract/step2";
import Step3 from "@/components/tutorials/deploy-a-counter-contract/step3";
import Step4 from "@/components/tutorials/deploy-a-counter-contract/step4";
import Step5 from "@/components/tutorials/deploy-a-counter-contract/step5";
import Step6 from "@/components/tutorials/deploy-a-counter-contract/step6";
import Step7 from "@/components/tutorials/deploy-a-counter-contract/step7";

const tutorial: Tutorial = {
  id: "deploy-a-counter-contract",
  title: "Deploy a Counter Contract",
  tagline: "Deploy your own Counter Contract on testnet.",
  description:
    "This tutorial will walk you through developing your own custom Counter Contract and deploying it on testnet.",
  initialRoute: "/scripts",
  store,
  state,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6, Step7],
};

export default tutorial;
