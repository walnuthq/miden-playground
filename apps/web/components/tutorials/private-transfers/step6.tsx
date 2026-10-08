import type { TutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step6Content from "@/components/tutorials/private-transfers/step6.mdx";

const Step6: TutorialStep = {
  title: "Review your private transfer.",
  Content: Step6Content,
  NextStepButton: NextTutorialButton,
};

export default Step6;
