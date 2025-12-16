import { defaultTutorial, type Tutorial } from "@/lib/types/tutorial";
import store from "@/components/tutorials/tutorial9/store";
import state from "@/components/tutorials/tutorial9/state";
import Step1 from "@/components/tutorials/tutorial9/step1";
import Step2 from "@/components/tutorials/tutorial9/step2";
// import Step3 from "@/components/tutorials/tutorial6/step3";
// import Step4 from "@/components/tutorials/tutorial6/step4";
// import Step5 from "@/components/tutorials/tutorial6/step5";
// import Step6 from "@/components/tutorials/tutorial6/step6";
// import Step7 from "@/components/tutorials/tutorial6/step7";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "create-a-counter-note",
  number: 7,
  title: "Create a Counter note",
  tagline:
    "Create a note with custom logic interacting with the Counter Contract.",
  description:
    "Following up on the Counter Contract tutorial, we will create a custom note incrementing the counter value and asserting the count was updated.",
  initialRoute: "/scripts",
  store,
  state,
  steps: [Step1, Step2 /*, Step3, Step4, Step5, Step6, Step7*/],
};

export default tutorial;
