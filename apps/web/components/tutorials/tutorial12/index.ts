import { defaultTutorial, type Tutorial } from "@/lib/types/tutorial";
import state from "@/components/tutorials/tutorial12/state";
import Step1 from "@/components/tutorials/tutorial12/step1";
import Step2 from "@/components/tutorials/tutorial12/step2";
import Step3 from "@/components/tutorials/tutorial12/step3";
import Step4 from "@/components/tutorials/tutorial12/step4";
import Step5 from "@/components/tutorials/tutorial12/step5";
import Step6 from "@/components/tutorials/tutorial12/step6";
import Step7 from "@/components/tutorials/tutorial12/step7";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "wallet-backup",
  number: 12,
  title: "Wallet backup",
  tagline: "Backup your wallet using the Private State Manager and a multisig.",
  description: "",
  category: "advanced",
  initialRoute: "/accounts",
  state,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6, Step7],
};

export default tutorial;
