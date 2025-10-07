import { usePathname } from "next/navigation";
import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step1Content from "@/components/tutorials/tutorial5/step1.mdx";
import useScripts from "@/hooks/use-scripts";
import defaultScripts from "@/lib/types/default-scripts";

const useCompleted = () => {
  const pathname = usePathname();
  const { scripts } = useScripts();
  const defaultScriptIds = defaultScripts.map(({ id }) => id);
  const script = scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "account"
  );
  return pathname === `/scripts/${script?.id}`;
};

const Step1: TutorialStep = {
  title: "Create a new script from the Counter Contract example.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step1Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Create a new script."
          titleWhenCompleted="You created a Counter Contract script."
          description={
            <p>
              Click on the <em>"Create new script"</em> button and create a new{" "}
              <strong>Account Script</strong> from the{" "}
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
