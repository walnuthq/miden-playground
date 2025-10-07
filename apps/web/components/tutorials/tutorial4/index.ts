import { type Tutorial } from "@/lib/types/tutorial";
import store from "@/components/tutorials/tutorial4/store";
import state from "@/components/tutorials/tutorial4/state";
import Step1 from "@/components/tutorials/tutorial4/step1";
import Step2 from "@/components/tutorials/tutorial4/step2";
import Step3 from "@/components/tutorials/tutorial4/step3";
import Step4 from "@/components/tutorials/tutorial4/step4";
import Step5 from "@/components/tutorials/tutorial4/step5";

const tutorial: Tutorial = {
  id: "interact-with-the-counter-contract",
  number: 4,
  title: "Interact with the Counter Contract",
  tagline: "Increment the count of a Counter Contract on testnet.",
  description:
    "This tutorial will guide you through interacting with a Counter Contract by incrementing its counter on testnet.",
  initialRoute: "/scripts",
  store,
  state,
  steps: [Step1, Step2, Step3, Step4, Step5],
};

export default tutorial;
