import type { TutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step5Content from "@/components/tutorials/timelock-p2id-note/step5.mdx";
import useAccounts from "@/hooks/use-accounts";
import { getIdentifierPart } from "@/lib/utils/account";

const Step5: TutorialStep = {
  title: "Check the Test Wallet consumable notes.",
  Content: () => {
    const { wallets } = useAccounts();
    const testWallet = wallets.find(({ name }) => name === "Test Wallet");
    return (
      <Step5Content address={getIdentifierPart(testWallet?.address ?? "")} />
    );
  },
  NextStepButton: NextTutorialButton,
};

export default Step5;
