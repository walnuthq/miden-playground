import { usePathname } from "next/navigation";
import Step3Content from "@/components/tutorials/deploy-a-counter-contract/step3.mdx";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useComponents from "@/hooks/use-components";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const pathname = usePathname();
  const { components } = useComponents();
  const component = components.find(
    ({ type, scriptId }) =>
      type === "account-component" && scriptId.startsWith("counter-account_"),
  );
  return pathname === `/components/${component?.id}`;
};

const Step3: TutorialStep = {
  title: "Create an account component.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step3Content />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create an account component."
          titleWhenCompleted="You created an account component."
          description={
            <p>
              Click the <em>"Create new component"</em> button and create an{" "}
              <strong>Account Component</strong> from the script you created in
              the first step.
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
