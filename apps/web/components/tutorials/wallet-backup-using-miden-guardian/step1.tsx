import type { TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step1Content from "@/components/tutorials/wallet-backup-using-miden-guardian/step1.mdx";

const useCompleted = () => {
  const { connectedWallet } = useAccounts();
  return connectedWallet?.isPrivate;
};

const Step1: TutorialStep = {
  title: "Connect your private Bread Wallet to the Playground.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step1Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Connect your private Bread Wallet."
          titleWhenCompleted="Your private Bread Wallet is connected."
          description={
            <p>
              Click the <em>"Select Wallet"</em> button in the top-right corner,
              select <em>"Bread Wallet"</em> and connect a{" "}
              <strong>Private</strong> account to the Playground.
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
