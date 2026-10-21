import { usePathname } from "next/navigation";
import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import Step1Content from "@/components/tutorials/deploy-a-counter-contract/step1.mdx";
import useScripts from "@/hooks/use-scripts";

const useCompleted = () => {
  const pathname = usePathname();
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) =>
      id.startsWith("counter-account_") && type === "account-component",
  );
  return pathname === `/scripts/${script?.id}`;
};

const Step1: TutorialStep = {
  title: "Create the counter contract script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step1Content />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create the counter contract script."
          titleWhenCompleted="You created the counter contract script."
          description={
            <p>
              Click the <em>"Create new script"</em> button and create an{" "}
              <strong>Account Component</strong> script from the{" "}
              <strong>Counter Contract</strong> example.
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

export default Step1;
