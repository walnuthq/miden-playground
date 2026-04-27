import type { TutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step6Content from "@/components/tutorials/private-transfers/step6.mdx";

const Step7: TutorialStep = {
  title: "Check on-chain activity.",
  Content: Step6Content,
  NextStepButton: NextTutorialButton,
};

export default Step7;
