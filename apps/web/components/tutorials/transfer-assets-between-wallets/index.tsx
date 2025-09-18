import { type Tutorial } from "@/lib/types/tutorial";
import state from "@/components/tutorials/transfer-assets-between-wallets/state";
import store from "@/components/tutorials/transfer-assets-between-wallets/store";
import Step1 from "@/components/tutorials/transfer-assets-between-wallets/step1";
import Step2 from "@/components/tutorials/transfer-assets-between-wallets/step2";
import Step3 from "@/components/tutorials/transfer-assets-between-wallets/step3";
import Step4 from "@/components/tutorials/transfer-assets-between-wallets/step4";
import Step5 from "@/components/tutorials/transfer-assets-between-wallets/step5";

const tutorial: Tutorial = {
  id: "transfer-assets-between-wallets",
  title: "Transfer assets between wallets",
  tagline: "Transfer tokens between 2 different wallets.",
  description:
    "This tutorial focuses on learning how to transfer assets between 2 wallets.",
  initialRoute: "/accounts",
  store,
  state,
  steps: [Step1, Step2, Step3, Step4, Step5],
};

export default tutorial;
