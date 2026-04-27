import type { Tutorial } from "@/lib/types/tutorial";
import { defaultTutorial } from "@/lib/utils/tutorial";
import state from "@/components/tutorials/interact-with-the-counter-contract/state";
import Step1 from "@/components/tutorials/interact-with-the-counter-contract/step1";
import Step2 from "@/components/tutorials/interact-with-the-counter-contract/step2";
import Step3 from "@/components/tutorials/interact-with-the-counter-contract/step3";
import Step4 from "@/components/tutorials/interact-with-the-counter-contract/step4";
import Step5 from "@/components/tutorials/interact-with-the-counter-contract/step5";
import Step6 from "@/components/tutorials/interact-with-the-counter-contract/step6";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "interact-with-the-counter-contract",
  number: 6,
  title: "Interact with the Counter Contract",
  tagline: "Increment the count of a Counter Contract on testnet.",
  description:
    "This tutorial will guide you through interacting with a Counter Contract by incrementing its counter on testnet.",
  initialRoute: "/scripts",
  state,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6],
};

export default tutorial;
