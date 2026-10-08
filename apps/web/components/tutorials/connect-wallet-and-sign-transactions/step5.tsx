import type { TutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step5Content from "@/components/tutorials/connect-wallet-and-sign-transactions/step5.mdx";

const Step5: TutorialStep = {
  title: "Check your wallet activity.",
  Content: Step5Content,
  NextStepButton: NextTutorialButton,
};

export default Step5;
