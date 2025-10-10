import { type TutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step5Content from "@/components/tutorials/tutorial6/step5.mdx";

const Step5: TutorialStep = {
  title: "Check the Test Wallet consumable notes.",
  Content: () => <Step5Content />,
  NextStepButton: NextTutorialButton,
};

export default Step5;
