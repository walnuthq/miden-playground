import state from "@/components/tutorials/create-and-fund-wallet/state";
import Step1 from "@/components/tutorials/create-and-fund-wallet/step1";
import Step2 from "@/components/tutorials/create-and-fund-wallet/step2";
import Step3 from "@/components/tutorials/create-and-fund-wallet/step3";
import Step4 from "@/components/tutorials/create-and-fund-wallet/step4";
import Step5 from "@/components/tutorials/create-and-fund-wallet/step5";
import Step6 from "@/components/tutorials/create-and-fund-wallet/step6";
import store from "@/components/tutorials/create-and-fund-wallet/store";
import { tutorialMeta } from "@/components/tutorials/meta";
import type { Tutorial } from "@/lib/types/tutorial";
import { defaultTutorial } from "@/lib/utils/tutorial";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  ...tutorialMeta("create-and-fund-wallet"),
  networkId: "mtst",
  state,
  store,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6],
};

export default tutorial;
