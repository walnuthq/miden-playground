import { defaultTutorial, type Tutorial } from "@/lib/types/tutorial";
import { defaultStore } from "@/lib/types/store";
import state from "@/components/tutorials/tutorial7/state";
import Step1 from "@/components/tutorials/tutorial7/step1";
import Step2 from "@/components/tutorials/tutorial7/step2";
import Step3 from "@/components/tutorials/tutorial7/step3";
import Step4 from "@/components/tutorials/tutorial7/step4";
import Step5 from "@/components/tutorials/tutorial7/step5";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "timelock-p2id-note",
  number: 7,
  title: "Timelock P2ID note",
  tagline: "Create your own custom time locked P2ID note.",
  description:
    "In this tutorial we create a time locked P2ID note script and discover how it can be acknowledged by the network before consumed by another account.",
  category: "advanced",
  initialRoute: "/scripts",
  store: defaultStore(),
  state,
  steps: [Step1, Step2, Step3, Step4, Step5],
};

export default tutorial;
