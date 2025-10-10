import { type TutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step7Content from "@/components/tutorials/tutorial5/step7.mdx";

const Step7: TutorialStep = {
  title: "Refresh the counter value.",
  Content: Step7Content,
  NextStepButton: NextTutorialButton,
};

export default Step7;
