import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step2Content from "@/components/tutorials/tutorial7/step2.mdx";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { components } = useComponents();
  const component = components.find(
    ({ id, type }) => !defaultComponentIds.includes(id) && type === "account",
  );
  const counter = accounts.find(
    ({ components, storageMode }) =>
      components.includes(component?.id ?? "") && storageMode === "network",
  );
  return !!counter;
};

const Step2: TutorialStep = {
  title: "Deploy a network Counter smart contract.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step2Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Deploy a network Counter."
          titleWhenCompleted="You deployed a network Counter."
          description={
            <p>
              Click on the <em>"Create new account"</em> button and deploy a
              network account by selecting the <strong>Network</strong> storage
              mode. Use the <strong>NoAuth</strong> authentication scheme and
              the <strong>Counter Contract</strong> component.
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

export default Step2;
