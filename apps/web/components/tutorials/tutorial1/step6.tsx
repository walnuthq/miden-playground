import { type TutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step6Content from "@/components/tutorials/tutorial1/step6.mdx";

const Step6: TutorialStep = {
  title: "Confirm your wallet is funded.",
  Content: Step6Content,
  NextStepButton: NextTutorialButton,
};

export default Step6;
