import type { TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import Step3Content from "@/components/tutorials/connect-wallet-and-sign-transactions/step3.mdx";

const Step3: TutorialStep = {
  title: "Meet the recipient wallet.",
  Content: () => {
    const { wallets, connectedWallet } = useAccounts();
    const recipient = wallets.find(
      ({ address }) => connectedWallet && address !== connectedWallet.address,
    );
    return <Step3Content wallet={recipient} />;
  },
  NextStepButton: () => <NextStepButton />,
};

export default Step3;
