import type { Tutorial } from "@/lib/types/tutorial";
import { defaultTutorial } from "@/lib/utils/tutorial";
import { defaultState } from "@/lib/utils/state";
import { midenFaucetAccount } from "@/lib/utils/account";
import Step1 from "@/components/tutorials/connect-wallet-and-sign-transactions/step1";
import Step2 from "@/components/tutorials/connect-wallet-and-sign-transactions/step2";
import Step3 from "@/components/tutorials/connect-wallet-and-sign-transactions/step3";
import Step4 from "@/components/tutorials/connect-wallet-and-sign-transactions/step4";
import Step5 from "@/components/tutorials/connect-wallet-and-sign-transactions/step5";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "connect-wallet-and-sign-transactions",
  number: 3,
  title: "Connect a wallet and sign transactions",
  tagline: "Connect your Bread Wallet and sign transactions on testnet.",
  description:
    "In this tutorial, you'll connect your Bread Wallet to the Miden Playground and sign transactions on Miden testnet.",
  initialRoute: "/accounts",
  state: {
    ...defaultState(),
    accounts: [midenFaucetAccount("mtst")],
    tutorialId: "connect-wallet-and-sign-transactions",
  },
  steps: [Step1, Step2, Step3, Step4, Step5],
};

export default tutorial;
