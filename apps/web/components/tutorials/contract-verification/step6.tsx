import { useState } from "react";
import type { TutorialStep } from "@/lib/types/tutorial";
import { useInterval } from "usehooks-ts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step6Content from "@/components/tutorials/contract-verification/step6.mdx";
import useAccounts from "@/hooks/use-accounts";
import { getVerifiedAccountComponents } from "@/lib/api";
import useNetwork from "@/hooks/use-network";

const useCompleted = () => {
  const [completed, setCompleted] = useState(false);
  const { networkId } = useNetwork();
  const { accounts } = useAccounts();
  const counter = accounts.find(({ name }) => name === "Unverified Contract");
  useInterval(
    () => {
      const checkVerifiedAccountComponents = async () => {
        const { components: verifiedAccountComponents = [] } =
          await getVerifiedAccountComponents({
            networkId,
            identifier: counter?.identifier ?? "",
          });
        setCompleted(verifiedAccountComponents.length > 0);
      };
      checkVerifiedAccountComponents();
    },
    completed ? null : 5000,
  );
  return completed;
};

const Step6: TutorialStep = {
  title: "Verify the imported contract.",
  Content: () => {
    const completed = useCompleted();
    const { accounts } = useAccounts();
    const counter = accounts.find(({ name }) => name === "Unverified Contract");
    return (
      <>
        <Step6Content counter={counter} />
        <TutorialAlert
          completed={completed}
          title="Action required: Verify the contract."
          titleWhenCompleted="You verified the contract."
          description={
            <p>
              Click on the <em>"Verify account component"</em> button and upload
              the contract source code.
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

export default Step6;
