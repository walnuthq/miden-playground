import { useEffect } from "react";
import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step5Content from "@/components/tutorials/tutorial7/step5.mdx";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";

let initialNonce = 0;

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { components } = useComponents();
  const component = components.find(
    ({ id, type }) => !defaultComponentIds.includes(id) && type === "account"
  );
  const counter = accounts.find(
    ({ components, storageMode }) =>
      components.includes(component?.id ?? "") && storageMode === "network"
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
  title: "Create a network note by executing a transaction.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step5Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Create the network note."
          titleWhenCompleted="You created the network note."
          description={
            <p>Follow the instructions to create your custom network note.</p>
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
