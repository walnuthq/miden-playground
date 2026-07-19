import type { Tutorial } from "@/lib/types/tutorial";
import { defaultTutorial } from "@/lib/utils/tutorial";
import state from "@/components/tutorials/foreign-procedure-invocation/state";
import Step1 from "@/components/tutorials/foreign-procedure-invocation/step1";
import Step2 from "@/components/tutorials/foreign-procedure-invocation/step2";
import Step3 from "@/components/tutorials/foreign-procedure-invocation/step3";
import Step4 from "@/components/tutorials/foreign-procedure-invocation/step4";
import Step5 from "@/components/tutorials/foreign-procedure-invocation/step5";
import Step6 from "@/components/tutorials/foreign-procedure-invocation/step6";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "foreign-procedure-invocation",
  number: 10,
  title: "Foreign Procedure Invocation",
  tagline:
    "Using foreign procedure invocation to craft read-only cross-contract calls.",
  description:
    "Following up on the Counter Contract tutorial, we will create a Count Reader contract that can copy its value from another contract.",
  category: "advanced",
  initialRoute: "/scripts",
  state,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6],
};

export default tutorial;
