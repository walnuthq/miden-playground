import { type TutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step6Content from "@/components/tutorials/tutorial1/step6.mdx";
import useAccounts from "@/hooks/use-accounts";

const Step6: TutorialStep = {
  title: "Confirm your wallet is funded.",
  Content: () => {
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    return <Step6Content wallet={wallet} />;
  },
  NextStepButton: NextTutorialButton,
};

export default Step6;
