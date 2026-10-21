import { useEffect, useState } from "react";
import Step5Content from "@/components/tutorials/interact-with-the-counter-contract/step5.mdx";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import { counterContractAddress } from "@/lib/constants";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const [initialNonce, setInitialNonce] = useState(0);
  const { networkId } = useNetwork();
  const { accounts } = useAccounts();
  const counter = accounts.find(
    ({ address }) => address === counterContractAddress(networkId),
  );
  const currentNonce = counter?.nonce ?? 0;
  useEffect(() => {
    if (initialNonce === 0) {
      setInitialNonce(currentNonce);
    }
  }, [initialNonce, currentNonce]);
  return initialNonce !== 0 && currentNonce > initialNonce;
};

const Step5: TutorialStep = {
  title: "Invoke the counter contract procedures.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step5Content />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Increment the counter."
          titleWhenCompleted="Your increment transaction has been submitted."
          description={
            <p>
              In the <em>"Components"</em> tab of the account details page,
              click the <em>"Invoke"</em> button next to the{" "}
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
