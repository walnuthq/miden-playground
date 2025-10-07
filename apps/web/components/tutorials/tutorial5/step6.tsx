import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step6Content from "@/components/tutorials/tutorial5/step6.mdx";
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
  const nonce = counter?.nonce ?? 0n;
  return nonce > 0n;
};

const Step6: TutorialStep = {
  title: "Interact with your Counter Contract.",
  Content: () => {
    const { accounts } = useAccounts();
    const { components } = useComponents();
    const defaultComponentIds = defaultComponents.map(({ id }) => id);
    const component = components.find(
      ({ id, type }) => !defaultComponentIds.includes(id) && type === "account"
    );
    const counter = accounts.find(({ components }) =>
      components.includes(component?.id ?? "")
    );
    const completed = useCompleted();
    return (
      <>
        <Step6Content counter={counter} />
        <TutorialAlert
          completed={completed}
          title="Action required: Invoke your Counter Contract procedure."
          titleWhenCompleted="You invoked your Counter Contract procedure."
          description={
            <p>
              Click on the <em>"Invoke"</em> button from your newly deployed
              contract to increment the counter.
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
