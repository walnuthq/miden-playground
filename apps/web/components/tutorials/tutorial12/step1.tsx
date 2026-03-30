import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step1Content from "@/components/tutorials/tutorial12/step1.mdx";

const useCompleted = () => {
  const { connectedWallet } = useAccounts();
  return connectedWallet?.storageMode === "private";
};

const Step1: TutorialStep = {
  title: "Connect a private wallet to the playground.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step1Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Connect a private wallet."
          titleWhenCompleted="Your wallet is connected and imported."
          description={
            <p>
              Click on the <em>"Select Wallet"</em> button in the top-right
              corner and connect a <strong>Private</strong> wallet to the
              Playground.
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
