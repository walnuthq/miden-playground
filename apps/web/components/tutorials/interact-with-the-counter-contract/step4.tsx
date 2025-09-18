import { useEffect } from "react";
import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step4Content from "@/components/tutorials/interact-with-the-counter-contract/step4.mdx";
import useAccounts from "@/hooks/use-accounts";
import { COUNTER_CONTRACT_ADDRESS } from "@/lib/constants";

let initialNonce = 0n;

const Step4: TutorialStep = {
  title: "Invoke the Counter Contract procedures.",
  Content: () => {
    const { accounts } = useAccounts();
    const counter = accounts.find(
      ({ address }) => address === COUNTER_CONTRACT_ADDRESS
    );
    const currentNonce = counter?.nonce ?? 0n;
    useEffect(() => {
      if (initialNonce === 0n) {
        initialNonce = currentNonce;
      }
    }, [currentNonce]);
    return (
      <>
        <Step4Content />
        <TutorialAlert
          completed={currentNonce > initialNonce}
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
    const { accounts } = useAccounts();
    const counter = accounts.find(
      ({ address }) => address === COUNTER_CONTRACT_ADDRESS
    );
    const currentNonce = counter?.nonce ?? 0n;
    useEffect(() => {
      if (initialNonce === 0n) {
        initialNonce = currentNonce;
      }
    }, [currentNonce]);
    return <NextStepButton disabled={currentNonce <= initialNonce} />;
  },
};

export default Step4;
