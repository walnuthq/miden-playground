import { tutorialMeta } from "@/components/tutorials/meta";
import Step1 from "@/components/tutorials/wallet-backup-using-miden-guardian/step1";
import Step2 from "@/components/tutorials/wallet-backup-using-miden-guardian/step2";
import Step3 from "@/components/tutorials/wallet-backup-using-miden-guardian/step3";
import Step4 from "@/components/tutorials/wallet-backup-using-miden-guardian/step4";
import Step5 from "@/components/tutorials/wallet-backup-using-miden-guardian/step5";
import Step6 from "@/components/tutorials/wallet-backup-using-miden-guardian/step6";
import Step7 from "@/components/tutorials/wallet-backup-using-miden-guardian/step7";
import type { Tutorial } from "@/lib/types/tutorial";
import { midenFaucetAccount } from "@/lib/utils/account";
import { defaultState } from "@/lib/utils/state";
import { defaultTutorial } from "@/lib/utils/tutorial";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  ...tutorialMeta("wallet-backup-using-miden-guardian"),
  state: {
    ...defaultState(),
    accounts: [midenFaucetAccount("mtst")],
    tutorialId: "wallet-backup-using-miden-guardian",
  },
  steps: [Step1, Step2, Step3, Step4, Step5, Step6, Step7],
};

export default tutorial;
