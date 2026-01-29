import { type TutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step6Content from "@/components/tutorials/tutorial3/step6.mdx";

const Step6: TutorialStep = {
  title: "Check your wallet activity.",
  Content: Step6Content,
  NextStepButton: NextTutorialButton,
};

export default Step6;
