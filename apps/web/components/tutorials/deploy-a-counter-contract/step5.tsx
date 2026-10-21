import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import Step5Content from "@/components/tutorials/deploy-a-counter-contract/step5.mdx";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { components } = useComponents();
  const component = components.find(
    ({ type, scriptId }) =>
      type === "account-component" && scriptId.startsWith("counter-account_"),
  );
  const counter = accounts.find(({ components }) =>
    components.includes(component?.id ?? ""),
  );
  return !!counter;
};

const Step5: TutorialStep = {
  title: "Deploy your counter contract.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step5Content />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Deploy your counter contract."
          titleWhenCompleted="You deployed your counter contract."
          description={
            <p>
              Click the <em>"Create new account"</em> button at the top of the
              accounts page, select the <em>"Deploy account"</em> option and
              deploy an Account using the <strong>No Auth</strong>{" "}
              authentication component and your account component.
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
