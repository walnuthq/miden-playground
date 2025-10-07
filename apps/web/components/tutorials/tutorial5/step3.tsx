import { usePathname } from "next/navigation";
import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step3Content from "@/components/tutorials/tutorial5/step3.mdx";
import useComponents from "@/hooks/use-components";
import defaultComponents from "@/lib/types/default-components";

const useCompleted = () => {
  const pathname = usePathname();
  const { components } = useComponents();
  const defaultComponentIds = defaultComponents.map(({ id }) => id);
  const component = components.find(
    ({ id, type }) => !defaultComponentIds.includes(id) && type === "account"
  );
  return pathname === `/components/${component?.id}`;
};

const Step3: TutorialStep = {
  title: "Create an Account Component.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step3Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Create an Account Component."
          titleWhenCompleted="You created an Account Component."
          description={
            <p>
              Click on the <em>"Create new component"</em> button and create a
              component from the <strong>Counter Contract</strong> script, make
              sure to select <strong>Account Component</strong> type.
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
