import { defaultTutorial, type Tutorial } from "@/lib/types/tutorial";
import { defaultStore } from "@/lib/types/store";
import state from "@/components/tutorials/tutorial11/state";
import Step1 from "@/components/tutorials/tutorial11/step1";
import Step2 from "@/components/tutorials/tutorial11/step2";
import Step3 from "@/components/tutorials/tutorial11/step3";
import Step4 from "@/components/tutorials/tutorial11/step4";
import Step5 from "@/components/tutorials/tutorial11/step5";
import Step6 from "@/components/tutorials/tutorial11/step6";
import Step7 from "@/components/tutorials/tutorial11/step7";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "private-transfers",
  number: 11,
  title: "Private transfers",
  tagline: "Learn how to perform privacy preserving transfers on Miden.",
  description:
    "Perform transactions to move assets between wallets while preserving your privacy.",
  category: "beginner",
  initialRoute: "/accounts",
  store: defaultStore(),
  state,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6, Step7],
};

export default tutorial;
