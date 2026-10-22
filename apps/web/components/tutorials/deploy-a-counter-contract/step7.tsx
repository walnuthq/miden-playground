import Step7Content from "@/components/tutorials/deploy-a-counter-contract/step7.mdx";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step7: TutorialStep = {
  title: "Read the updated counter value.",
  Content: Step7Content,
  NextStepButton: NextTutorialButton,
};

export default Step7;
