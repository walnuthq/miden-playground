import { usePathname } from "next/navigation";
import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step1Content from "@/components/tutorials/tutorial10/step1.mdx";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";

const useCompleted = () => {
  const pathname = usePathname();
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "account",
  );
  return (
    pathname === `/scripts/${script?.id}` && script?.name === "counter-account"
  );
};

const Step1: TutorialStep = {
  title: "Create a new account script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step1Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Create a new script."
          titleWhenCompleted="You created an Account Component script."
          description={
            <p>
              Click on the <em>"Create new script"</em> button and create a new{" "}
              <strong>Account Component</strong> with the{" "}
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
