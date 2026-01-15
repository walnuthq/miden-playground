import { defaultTutorial, type Tutorial } from "@/lib/types/tutorial";
import store from "@/components/tutorials/tutorial10/store";
import state from "@/components/tutorials/tutorial10/state";
import Step1 from "@/components/tutorials/tutorial10/step1";
import Step2 from "@/components/tutorials/tutorial10/step2";
import Step3 from "@/components/tutorials/tutorial10/step3";
import Step4 from "@/components/tutorials/tutorial10/step4";
import Step5 from "@/components/tutorials/tutorial10/step5";
import Step6 from "@/components/tutorials/tutorial10/step6";
import Step7 from "@/components/tutorials/tutorial10/step7";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "contract-verification",
  number: 10,
  title: "Contract verification",
  tagline: "Deploy and verify custom smart contracts on-chain.",
  description:
    "In this tutorial we learn how to develop custom Miden contracts, deploy them on-chain, and verify them using the Miden playground.",
  category: "advanced",
  initialRoute: "/scripts",
  store,
  state,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6, Step7],
};

export default tutorial;
