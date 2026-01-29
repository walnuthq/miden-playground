import { defaultTutorial, type Tutorial } from "@/lib/types/tutorial";
import { defaultStore } from "@/lib/types/store";
import state from "@/components/tutorials/tutorial3/state";
import Step1 from "@/components/tutorials/tutorial3/step1";
import Step2 from "@/components/tutorials/tutorial3/step2";
import Step3 from "@/components/tutorials/tutorial3/step3";
import Step4 from "@/components/tutorials/tutorial3/step4";
import Step5 from "@/components/tutorials/tutorial3/step5";
import Step6 from "@/components/tutorials/tutorial3/step6";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "connect-wallet-and-sign-transactions",
  number: 3,
  title: "Connect wallet and sign transactions",
  tagline: "Connect your Miden Wallet and sign transactions on testnet.",
  description:
    "This tutorial will walk you through connecting your Miden Wallet to the Miden Playground and confirming transactions on Miden testnet.",
  initialRoute: "/accounts",
  store: defaultStore(),
  state,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6],
};

export default tutorial;
