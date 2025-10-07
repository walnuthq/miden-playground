import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step1Content from "@/components/tutorials/tutorial1/step1.mdx";
import useAccounts from "@/hooks/use-accounts";

const useCompleted = () => {
  const { wallets } = useAccounts();
  const wallet = wallets.find(({ isPublic }) => isPublic);
  return !!wallet;
};

const Step1: TutorialStep = {
  title: "Create your first wallet Account.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step1Content />
        <TutorialAlert
          completed={completed}
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
    const completed = useCompleted();
    return <NextStepButton disabled={!completed} />;
  },
};

export default Step1;
