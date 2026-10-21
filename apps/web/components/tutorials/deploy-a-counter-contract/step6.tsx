import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import Step6Content from "@/components/tutorials/deploy-a-counter-contract/step6.mdx";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";

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
  const nonce = counter?.nonce ?? 0;
  return nonce >= 2;
};

const Step6: TutorialStep = {
  title: "Increment your counter contract.",
  Content: () => {
    const { accounts } = useAccounts();
    const { components } = useComponents();
    const component = components.find(
      ({ id, type }) =>
        !defaultComponentIds.includes(id) && type === "account-component",
    );
    const counter = accounts.find(({ components }) =>
      components.includes(component?.id ?? ""),
    );
    const completed = useCompleted();
    return (
      <>
        <Step6Content counter={counter} />
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

export default Step6;
