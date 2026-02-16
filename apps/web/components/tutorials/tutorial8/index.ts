import { defaultTutorial, type Tutorial } from "@/lib/types/tutorial";
import state from "@/components/tutorials/tutorial8/state";
import Step1 from "@/components/tutorials/tutorial8/step1";
import Step2 from "@/components/tutorials/tutorial8/step2";
import Step3 from "@/components/tutorials/tutorial8/step3";
import Step4 from "@/components/tutorials/tutorial8/step4";
import Step5 from "@/components/tutorials/tutorial8/step5";
import Step6 from "@/components/tutorials/tutorial8/step6";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "network-transactions",
  number: 8,
  title: "Network transactions",
  tagline:
    "Deploy and interact with smart contracts using network transactions.",
  description:
    "In this tutorial, we will explore Network Transactions (NTXs) on Miden - a powerful feature that enables autonomous smart contract execution and public shared state management.",
  initialRoute: "/accounts",
  state,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6],
};

export default tutorial;
