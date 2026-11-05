import Step1 from "@/components/tutorials/connect-wallet-and-sign-transactions/step1";
import Step2 from "@/components/tutorials/connect-wallet-and-sign-transactions/step2";
import Step3 from "@/components/tutorials/connect-wallet-and-sign-transactions/step3";
import Step4 from "@/components/tutorials/connect-wallet-and-sign-transactions/step4";
import Step5 from "@/components/tutorials/connect-wallet-and-sign-transactions/step5";
import { tutorialMeta } from "@/components/tutorials/meta";
import type { Tutorial } from "@/lib/types/tutorial";
import { midenFaucetAccount } from "@/lib/utils/account";
import { defaultState } from "@/lib/utils/state";
import { defaultTutorial } from "@/lib/utils/tutorial";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  ...tutorialMeta("connect-wallet-and-sign-transactions"),
  state: {
    ...defaultState(),
    accounts: [midenFaucetAccount("mtst")],
    tutorialId: "connect-wallet-and-sign-transactions",
  },
  steps: [Step1, Step2, Step3, Step4, Step5],
};

export default tutorial;
