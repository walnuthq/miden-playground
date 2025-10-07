import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step5Content from "@/components/tutorials/tutorial5/step5.mdx";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import defaultComponents from "@/lib/types/default-components";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { components } = useComponents();
  const defaultComponentIds = defaultComponents.map(({ id }) => id);
  const component = components.find(
    ({ id, type }) => !defaultComponentIds.includes(id) && type === "account"
  );
  const counter = accounts.find(({ components }) =>
    components.includes(component?.id ?? "")
  );
  return !!counter;
};

const Step5: TutorialStep = {
  title: "Deploy your Counter Contract.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step5Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Deploy a Counter Contract."
          titleWhenCompleted="You deployed a Counter Contract."
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

export default Step5;
