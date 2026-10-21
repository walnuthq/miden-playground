import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import Step4Content from "@/components/tutorials/your-first-smart-contract-and-custom-note/step4.mdx";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "note",
  );
  return script?.status === "compiled";
};

const Step4: TutorialStep = {
  title: "Understand and compile the counter note script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step4Content />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Compile the counter note script."
          titleWhenCompleted="You compiled the counter note script."
          description={
            <p>
              Once you've read the note script code, click the{" "}
              <em>"Compile"</em> button to compile the script.
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

export default Step4;
