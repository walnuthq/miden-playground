import type { TutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import Step5Content from "@/components/tutorials/tutorial7/step5.mdx";
import useNetwork from "@/hooks/use-network";
import { getIdentifierPart } from "@/lib/utils/account";
import { testWalletAddress } from "@/lib/constants";

const Step5: TutorialStep = {
  title: "Check the Test Wallet consumable notes.",
  Content: () => {
    const { networkId } = useNetwork();
    return (
      <Step5Content address={getIdentifierPart(testWalletAddress(networkId))} />
    );
  },
  NextStepButton: NextTutorialButton,
};

export default Step5;
