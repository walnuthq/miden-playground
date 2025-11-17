import { type Tutorial } from "@/lib/types/tutorial";
import store from "@/components/tutorials/tutorial8/store";
import state from "@/components/tutorials/tutorial8/state";
import Step1 from "@/components/tutorials/tutorial8/step1";
import Step2 from "@/components/tutorials/tutorial8/step2";
import Step3 from "@/components/tutorials/tutorial8/step3";
import Step4 from "@/components/tutorials/tutorial8/step4";
import Step5 from "@/components/tutorials/tutorial8/step5";
import Step6 from "@/components/tutorials/tutorial8/step6";

const tutorial: Tutorial = {
  id: "foreign-procedure-invocation",
  number: 8,
  title: "Foreign Procedure Invocation",
  tagline:
    "Using foreign procedure invocation to craft read-only cross-contract calls.",
  description:
    "Following up on the Counter Contract tutorial, we will create a Count Reader contract that can copy its value from another contract.",
  initialRoute: "/scripts",
  store,
  state,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6],
};

export default tutorial;
