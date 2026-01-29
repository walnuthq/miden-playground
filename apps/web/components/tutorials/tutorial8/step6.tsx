import { defaultTutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step6Content from "@/components/tutorials/tutorial8/step6.mdx";

export default {
  ...defaultTutorialStep(),
  title: "Check the Test Wallet consumable notes.",
  Content: Step6Content,
  NextStepButton: NextTutorialButton,
};
