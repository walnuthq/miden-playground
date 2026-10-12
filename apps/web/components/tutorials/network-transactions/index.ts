import type { Tutorial } from "@/lib/types/tutorial";
import { defaultTutorial } from "@/lib/utils/tutorial";
import state from "@/components/tutorials/network-transactions/state";
import Step1 from "@/components/tutorials/network-transactions/step1";
import Step2 from "@/components/tutorials/network-transactions/step2";
import Step3 from "@/components/tutorials/network-transactions/step3";
import Step4 from "@/components/tutorials/network-transactions/step4";
import Step5 from "@/components/tutorials/network-transactions/step5";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "network-transactions",
  number: 9,
  title: "Network transactions",
  tagline: "Deploy a network counter and increment it with a network note.",
  description:
    "In this tutorial, you'll deploy a network counter contract on testnet and increment it with a network note, consumed by the network transaction builder.",
  category: "advanced",
  initialRoute: "/accounts",
  state,
  steps: [Step1, Step2, Step3, Step4, Step5],
};

export default tutorial;
