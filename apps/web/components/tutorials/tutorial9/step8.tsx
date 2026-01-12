import { type TutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step8Content from "@/components/tutorials/tutorial9/step8.mdx";

const Step8: TutorialStep = {
  title: "Refresh the counter value.",
  Content: Step8Content,
  NextStepButton: NextTutorialButton,
};

export default Step8;
