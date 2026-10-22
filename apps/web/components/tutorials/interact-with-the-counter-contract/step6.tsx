import Step6Content from "@/components/tutorials/interact-with-the-counter-contract/step6.mdx";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step6: TutorialStep = {
  title: "Read the updated counter value.",
  Content: Step6Content,
  NextStepButton: NextTutorialButton,
};

export default Step6;
