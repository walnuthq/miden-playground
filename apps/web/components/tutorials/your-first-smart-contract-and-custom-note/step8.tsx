import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step8Content from "@/components/tutorials/your-first-smart-contract-and-custom-note/step8.mdx";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step8: TutorialStep = {
  title: "Read the updated counter value.",
  Content: Step8Content,
  NextStepButton: NextTutorialButton,
};

export default Step8;
