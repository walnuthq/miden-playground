import { tutorialMeta } from "@/components/tutorials/meta";
import state from "@/components/tutorials/transfer-assets-between-wallets/state";
import Step1 from "@/components/tutorials/transfer-assets-between-wallets/step1";
import Step2 from "@/components/tutorials/transfer-assets-between-wallets/step2";
import Step3 from "@/components/tutorials/transfer-assets-between-wallets/step3";
import Step4 from "@/components/tutorials/transfer-assets-between-wallets/step4";
import Step5 from "@/components/tutorials/transfer-assets-between-wallets/step5";
import store from "@/components/tutorials/transfer-assets-between-wallets/store";
import type { Tutorial } from "@/lib/types/tutorial";
import { defaultTutorial } from "@/lib/utils/tutorial";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  ...tutorialMeta("transfer-assets-between-wallets"),
  state,
  store,
  steps: [Step1, Step2, Step3, Step4, Step5],
};

export default tutorial;
