import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step3Content from "@/components/tutorials/tutorial10/step3.mdx";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";
import useAccounts from "@/hooks/use-accounts";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { components } = useComponents();
  const component = components.find(
    ({ id, type }) => !defaultComponentIds.includes(id) && type === "account"
  );
  const counter = accounts.find(({ components }) =>
    components.includes(component?.id ?? "")
  );
  return !!counter;
};

const Step3: TutorialStep = {
  title: "Deploy the Counter Contract.",
  Content: () => {
    const completed = useCompleted();
    const { accounts } = useAccounts();
    const { components } = useComponents();
    const component = components.find(
      ({ id, type }) => !defaultComponentIds.includes(id) && type === "account"
    );
    const counter = accounts.find(({ components }) =>
      components.includes(component?.id ?? "")
    );
    return (
      <>
        <Step3Content counter={counter} />
        <TutorialAlert
          completed={completed}
          title="Action required: Deploy the Counter Contract."
          titleWhenCompleted="You deployed the Counter Contract."
          description={
            <p>
              Click on the <em>"Create new account"</em> button and deploy an{" "}
              account using the <strong>NoAuth</strong> authentication scheme
              and the <strong>Counter Contract</strong> component.
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

export default Step3;
