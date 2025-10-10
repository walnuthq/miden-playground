import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step5Content from "@/components/tutorials/tutorial2/step5.mdx";

const Step5: TutorialStep = {
  title: "Confirm assets have been transferred.",
  Content: () => {
    const { wallets } = useAccounts();
    const walletB = wallets.find(({ name }) => name === "Wallet B");
    return <Step5Content walletB={walletB} />;
  },
  NextStepButton: NextTutorialButton,
};

export default Step5;
