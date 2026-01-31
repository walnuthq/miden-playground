import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step3Content from "@/components/tutorials/tutorial10/step3.mdx";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";

const useCompleted = () => {
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "note-script",
  );
  const dependenciesLength = script?.dependencies.length ?? 0;
  return dependenciesLength > 0;
};

const Step3: TutorialStep = {
  title: "Create a new note script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step3Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Create a new script."
          titleWhenCompleted="You created a note script."
          description={
            <p>
              Click on the <em>"Create new script"</em> button and create a new{" "}
              <strong>Note Script</strong> with the{" "}
              <strong>Counter Note</strong> example, then add the{" "}
              <strong>counter-account</strong> script as a dependency.
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
