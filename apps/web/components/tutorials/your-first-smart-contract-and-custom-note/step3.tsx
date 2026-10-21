import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import Step3Content from "@/components/tutorials/your-first-smart-contract-and-custom-note/step3.mdx";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "note",
  );
  const dependenciesLength = script?.dependencies.length ?? 0;
  return dependenciesLength > 0;
};

const Step3: TutorialStep = {
  title: "Create the counter note script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step3Content />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create the counter note script."
          titleWhenCompleted="You created the counter note script and added its dependency."
          description={
            <p>
              Click the <em>"Create new script"</em> button and create a{" "}
              <strong>Note Script</strong> from the{" "}
              <strong>Counter Note</strong> example, then add the{" "}
              <strong>counter-account</strong> script as a dependency in the{" "}
              <em>"Metadata"</em> tab.
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
