import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step4Content from "@/components/tutorials/tutorial10/step4.mdx";
import useAccounts from "@/hooks/use-accounts";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const counter = accounts.find(({ name }) => name === "Unverified Contract");
  return !!counter;
};

const Step4: TutorialStep = {
  title: "Import an unverified Counter Contract.",
  Content: () => {
    const completed = useCompleted();
    const { accounts } = useAccounts();
    const counter = accounts.find(({ name }) => name === "Unverified Contract");
    return (
      <>
        <Step4Content counter={counter} />
        <TutorialAlert
          completed={completed}
          title="Action required: Import the unverified contract."
          titleWhenCompleted="You imported the unverified contract."
          description={
            <p>
              Click on the <em>Import</em> button to import an unverified
              Counter Contract.
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

export default Step4;
