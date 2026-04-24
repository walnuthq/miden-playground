import type { Tutorial } from "@/lib/types/tutorial";
import { defaultTutorial } from "@/lib/utils/tutorial";
import { defaultState } from "@/lib/utils/state";
import { midenFaucetAccount } from "@/lib/utils/account";
import Step1 from "@/components/tutorials/tutorial4/step1";
import Step2 from "@/components/tutorials/tutorial4/step2";
import Step3 from "@/components/tutorials/tutorial4/step3";
import Step4 from "@/components/tutorials/tutorial4/step4";
import Step5 from "@/components/tutorials/tutorial4/step5";
import Step6 from "@/components/tutorials/tutorial4/step6";
import Step7 from "@/components/tutorials/tutorial4/step7";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "private-transfers",
  number: 4,
  title: "Private transfers",
  tagline: "Learn how to perform privacy preserving transfers on Miden.",
  description:
    "Perform transactions to move assets between wallets while preserving your privacy.",
  category: "beginner",
  initialRoute: "/accounts",
  state: {
    ...defaultState(),
    accounts: [midenFaucetAccount("mtst")],
    tutorialId: "private-transfers",
  },
  steps: [Step1, Step2, Step3, Step4, Step5, Step6, Step7],
};

export default tutorial;
