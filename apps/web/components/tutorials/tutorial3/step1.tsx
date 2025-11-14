import { usePathname } from "next/navigation";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step1Content from "@/components/tutorials/tutorial3/step1.mdx";

const useCompleted = () => {
  const pathname = usePathname();
  const { connectedWallet } = useAccounts();
  return pathname === `/accounts/${connectedWallet?.address}`;
};

const Step1: TutorialStep = {
  title: "Connect your wallet to testnet.",
  Content: () => {
    const { connectedWallet } = useAccounts();
    const completed = useCompleted();
    return (
      <>
        <Step1Content wallet={connectedWallet} />
        <TutorialAlert
          completed={completed}
          title="Action required: Connect your wallet."
          titleWhenCompleted="Your wallet is connected and imported."
          description={
            <p>
              Click on the <em>"Select Wallet"</em> button in the top-right
              corner and connect your Miden Wallet to the Playground, then once
              imported, navigate to your account details page.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    return <NextStepButton disabled={!completed} />;
  },
};

export default Step1;
