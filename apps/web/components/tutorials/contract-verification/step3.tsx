import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import Step3Content from "@/components/tutorials/contract-verification/step3.mdx";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";
import useAccounts from "@/hooks/use-accounts";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { components } = useComponents();
  const component = components.find(
    ({ id, type }) =>
      !defaultComponentIds.includes(id) && type === "account-component",
  );
  const counter = accounts.find(({ components }) =>
    components.includes(component?.id ?? ""),
  );
  return !!counter;
};

const Step3: TutorialStep = {
  title: "Deploy the counter contract.",
  Content: () => {
    const completed = useCompleted();
    const { accounts } = useAccounts();
    const { components } = useComponents();
    const component = components.find(
      ({ id, type }) =>
        !defaultComponentIds.includes(id) && type === "account-component",
    );
    const counter = accounts.find(({ components }) =>
      components.includes(component?.id ?? ""),
    );
    return (
      <>
        <Step3Content counter={counter} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Deploy the counter contract."
          titleWhenCompleted="You deployed the counter contract."
          description={
            <p>
              On the accounts page, click the <em>"Create new account"</em>{" "}
              button, select the <em>"Deploy account"</em> option and deploy a
              contract with the <strong>No Auth</strong> authentication
              component and the <strong>Counter Contract</strong> account
              component.
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
