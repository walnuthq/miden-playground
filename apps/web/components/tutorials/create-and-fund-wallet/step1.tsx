import { type TutorialStep } from "@/lib/types";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step1Content from "@/components/tutorials/create-and-fund-wallet/step1.mdx";
import useAccounts from "@/hooks/use-accounts";

const Step1: TutorialStep = {
  title: "Create your first wallet Account.",
  Content: () => {
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    return (
      <>
        <Step1Content />
        <TutorialAlert
          completed={!!wallet}
          title="Action required: Create your first public wallet."
          titleWhenCompleted="Your first wallet is created."
          description={
            <p>
              Click on the <em>"Create new account"</em> button then select the{" "}
              <em>"Create new wallet"</em> option to generate a wallet Account.{" "}
              <strong>Make sure to create a public wallet.</strong>
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const { wallets } = useAccounts();
    const wallet = wallets.find(({ isPublic }) => isPublic);
    return <NextStepButton disabled={!wallet} />;
  },
};

export default Step1;
