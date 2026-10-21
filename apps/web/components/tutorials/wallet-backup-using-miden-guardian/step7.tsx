import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step7Content from "@/components/tutorials/wallet-backup-using-miden-guardian/step7.mdx";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step7: TutorialStep = {
  title: "Review your wallet backup.",
  Content: Step7Content,
  NextStepButton: NextTutorialButton,
};

export default Step7;
