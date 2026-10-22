import NextStepButton from "@/components/tutorials/next-step-button";
import Step3Content from "@/components/tutorials/private-transfers/step3.mdx";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { connectedWallet } = useAccounts();
  return connectedWallet?.name === "Para Wallet";
};

const Step3: TutorialStep = {
  title: "Connect a Para Wallet to the Playground.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step3Content />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Connect a Para Wallet."
          titleWhenCompleted="Your Para Wallet is connected and imported."
          description={
            <p>
              Disconnect Bread Wallet, then click the <em>"Select Wallet"</em>{" "}
              button, select <em>"Para Wallet"</em> and log in with your email
              address.
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

export default Step3;
