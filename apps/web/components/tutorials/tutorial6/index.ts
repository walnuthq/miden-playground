import { defaultTutorial, type Tutorial } from "@/lib/types/tutorial";
import store from "@/components/tutorials/tutorial6/store";
import state from "@/components/tutorials/tutorial6/state";
import Step1 from "@/components/tutorials/tutorial6/step1";
import Step2 from "@/components/tutorials/tutorial6/step2";
import Step3 from "@/components/tutorials/tutorial6/step3";
import Step4 from "@/components/tutorials/tutorial6/step4";
import Step5 from "@/components/tutorials/tutorial6/step5";
// import Step6 from "@/components/tutorials/tutorial6/step6";
// import Step7 from "@/components/tutorials/tutorial6/step7";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "timelock-p2id-note",
  number: 6,
  title: "Timelock P2ID note",
  tagline: "Create your own custom time locked P2ID note.",
  description:
    "In this tutorial we create a time locked P2ID note script and discover how it can be acknowledged by the network before consumed by another account.",
  category: "advanced",
  initialRoute: "/scripts",
  store,
  state,
  steps: [Step1, Step2, Step3, Step4, Step5 /*, Step6, Step7*/],
};

export default tutorial;
