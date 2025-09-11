import { type Tutorial } from "@/lib/types";
import store from "@/components/tutorials/create-and-fund-wallet/store";
import state from "@/components/tutorials/create-and-fund-wallet/state";
import Step1 from "@/components/tutorials/create-and-fund-wallet/step1";
import Step2 from "@/components/tutorials/create-and-fund-wallet/step2";
import Step3 from "@/components/tutorials/create-and-fund-wallet/step3";
import Step4 from "@/components/tutorials/create-and-fund-wallet/step4";
import Step5 from "@/components/tutorials/create-and-fund-wallet/step5";
import Step6 from "@/components/tutorials/create-and-fund-wallet/step6";

const tutorial: Tutorial = {
  id: "create-and-fund-wallet",
  title: "Create and fund wallet",
  tagline: "Create a new wallet and fund it using a faucet.",
  description:
    "In this first tutorial, we'll create a new wallet and discover how to fund it by creating your first Miden transactions.",
  initialRoute: "/accounts",
  store,
  state,
  steps: [Step1, Step2, Step3, Step4, Step5, Step6],
};

export default tutorial;
