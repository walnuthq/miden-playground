import { type TutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step6Content from "@/components/tutorials/tutorial5/step6.mdx";

const Step6: TutorialStep = {
  title: "Refresh the counter value.",
  Content: Step6Content,
  NextStepButton: NextTutorialButton,
};

export default Step6;
