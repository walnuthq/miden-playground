import { useEffect } from "react";
import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step5Content from "@/components/tutorials/tutorial4/step5.mdx";
import useAccounts from "@/hooks/use-accounts";
import { COUNTER_CONTRACT_ADDRESS } from "@/lib/constants";

let initialNonce = 0;

const useCompleted = () => {
  const { accounts } = useAccounts();
  const counter = accounts.find(
    ({ address }) => address === COUNTER_CONTRACT_ADDRESS
  );
  const currentNonce = counter?.nonce ?? 0;
  useEffect(() => {
    if (initialNonce === 0) {
      initialNonce = currentNonce;
    }
  }, [currentNonce]);
  return initialNonce !== 0 && currentNonce > initialNonce;
};

const Step5: TutorialStep = {
  title: "Invoke the Counter Contract procedures.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step5Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Invoke the procedure."
          titleWhenCompleted="You have invoked the Counter Contract procedures."
          description={
            <p>
              Click on the <em>"Invoke"</em> button in the <em>"Components"</em>{" "}
              section of the account details page to invoke the{" "}
              <strong>increment_count</strong> procedure.
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

export default Step5;
