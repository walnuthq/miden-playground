import Step1 from "@/components/tutorials/contract-verification/step1";
import Step2 from "@/components/tutorials/contract-verification/step2";
import Step3 from "@/components/tutorials/contract-verification/step3";
import Step4 from "@/components/tutorials/contract-verification/step4";
import Step5 from "@/components/tutorials/contract-verification/step5";
import Step6 from "@/components/tutorials/contract-verification/step6";
import Step7 from "@/components/tutorials/contract-verification/step7";
import type { Tutorial } from "@/lib/types/tutorial";
import { midenFaucetAccount } from "@/lib/utils/account";
import { defaultState } from "@/lib/utils/state";
import { defaultTutorial } from "@/lib/utils/tutorial";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "contract-verification",
  number: 12,
  title: "Contract verification",
  tagline: "Verify a contract's source code so anyone can interact with it.",
  description:
    "In this tutorial, you'll extend a counter contract, deploy it on testnet, and verify an unverified copy of it by uploading its source code to the Playground.",
  category: "advanced",
  initialRoute: "/scripts",
  state: {
    ...defaultState(),
    accounts: [midenFaucetAccount("mtst")],
    tutorialId: "contract-verification",
  },
  steps: [Step1, Step2, Step3, Step4, Step5, Step6, Step7],
};

export default tutorial;
