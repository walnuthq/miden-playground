import { useEffect, useState } from "react";
import Step4Content from "@/components/tutorials/network-transactions/step4.mdx";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const [initialNonce, setInitialNonce] = useState(0);
  const { accounts } = useAccounts();
  const { components } = useComponents();
  const component = components.find(
    ({ id, type }) =>
      !defaultComponentIds.includes(id) && type === "account-component",
  );
  const counter = accounts.find(
    ({ components, isPublic }) =>
      components.includes(component?.id ?? "") &&
      isPublic &&
      components.includes("auth-network-account"),
  );
  const currentNonce = counter?.nonce ?? 0;
  useEffect(() => {
    if (initialNonce === 0) {
      setInitialNonce(currentNonce);
    }
  }, [initialNonce, currentNonce]);
  return initialNonce !== 0 && currentNonce > initialNonce;
};

const Step4: TutorialStep = {
  title: "Create the network note.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step4Content />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create the network note."
          titleWhenCompleted="Your network note has been consumed."
          description={
            <p>
              Create a network note targeting your network counter with the{" "}
              <em>"Create Note"</em> dialog, confirm the Transaction in your
              wallet, then wait for the network to consume the Note.
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
