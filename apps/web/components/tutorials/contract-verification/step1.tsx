import { usePathname } from "next/navigation";
import Step1Content from "@/components/tutorials/contract-verification/step1.mdx";
import useScriptName from "@/components/tutorials/contract-verification/use-script-name";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const pathname = usePathname();
  const { scripts } = useScripts();
  const scriptName = useScriptName();
  const script = scripts.find(
    ({ id, type }) =>
      !defaultScriptIds.includes(id) && type === "account-component",
  );
  return pathname === `/scripts/${script?.id}` && script?.name === scriptName;
};

const Step1: TutorialStep = {
  title: "Create the counter contract script.",
  Content: () => {
    const completed = useCompleted();
    const scriptName = useScriptName();
    return (
      <>
        <Step1Content scriptName={scriptName} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create the counter contract script."
          titleWhenCompleted="You created the counter contract script."
          description={
            <p>
              Click the <em>"Create new script"</em> button and create an{" "}
              <strong>Account Component</strong> script named{" "}
              <strong>{scriptName}</strong> from the{" "}
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
