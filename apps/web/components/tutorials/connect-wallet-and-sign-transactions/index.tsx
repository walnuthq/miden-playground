import { type Tutorial } from "@/lib/types/tutorial";
import state from "@/components/tutorials/connect-wallet-and-sign-transactions/state";
import store from "@/components/tutorials/connect-wallet-and-sign-transactions/store";
import Step1 from "@/components/tutorials/connect-wallet-and-sign-transactions/step1";
import Step2 from "@/components/tutorials/connect-wallet-and-sign-transactions/step2";
import Step3 from "@/components/tutorials/connect-wallet-and-sign-transactions/step3";
import Step4 from "@/components/tutorials/connect-wallet-and-sign-transactions/step4";
import Step5 from "@/components/tutorials/connect-wallet-and-sign-transactions/step5";
import Step6 from "@/components/tutorials/connect-wallet-and-sign-transactions/step6";

const tutorial: Tutorial = {
  id: "connect-wallet-and-sign-transactions",
  title: "Connect wallet and sign transactions",
  tagline: "Connect your Miden Wallet and sign transactions on testnet.",
  description:
    "This tutorial will walk you through connecting your Miden Wallet to the Miden Playground and confirming transactions on Miden testnet.",
  initialRoute: "/accounts",
  store,
  state,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6],
};

export default tutorial;
