import { tutorialMeta } from "@/components/tutorials/meta";
import Step1 from "@/components/tutorials/network-transactions/step1";
import Step2 from "@/components/tutorials/network-transactions/step2";
import Step3 from "@/components/tutorials/network-transactions/step3";
import Step4 from "@/components/tutorials/network-transactions/step4";
import Step5 from "@/components/tutorials/network-transactions/step5";
import type { Tutorial } from "@/lib/types/tutorial";
import { midenFaucetAccount } from "@/lib/utils/account";
import { counterExampleStarter } from "@/lib/utils/counter-example";
import { defaultState } from "@/lib/utils/state";
import { defaultTutorial } from "@/lib/utils/tutorial";

// The counter's scripts aren't in the state: the starter fetches the
// counter-contract example's compiled packages (counter-account and
// increment-note, whose masp is too big to embed) and adds the "Counter
// Contract" component. They're read-only: the steps only read them, and the
// note would no longer run against a counter compiled again from other code.
const tutorial: Tutorial = {
  ...defaultTutorial(),
  ...tutorialMeta("network-transactions"),
  state: {
    ...defaultState(),
    accounts: [midenFaucetAccount("mtst")],
    tutorialId: "network-transactions",
  },
  starter: () =>
    counterExampleStarter({
      componentName: "Counter Contract",
      readOnly: true,
    }),
  steps: [Step1, Step2, Step3, Step4, Step5],
};

export default tutorial;
