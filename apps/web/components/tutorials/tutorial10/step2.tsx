import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step2Content from "@/components/tutorials/tutorial10/step2.mdx";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import useComponents from "@/hooks/use-components";
import useTutorials from "@/hooks/use-tutorials";

const useCompleted = () => {
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "account",
  );
  const exports = script?.exports ?? [];
  const resetCountProcedure = exports.find(
    ({ digest }) =>
      digest ===
      "0x0f45560f0fc73fb1972c2793a3190799adc7b4a3a739004f50bf8fe5eb030e21",
  );
  return script?.status === "compiled" && !!resetCountProcedure;
};

const Step2: TutorialStep = {
  title: "Compile the script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step2Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Compile the script."
          titleWhenCompleted="You compiled the script."
          description={
            <p>
              Add the <strong>reset_count</strong> procedure and click on the{" "}
              <em>"Compile"</em> button to compile the script.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    const { scripts } = useScripts();
    const { components, newComponent } = useComponents();
    const { nextTutorialStep } = useTutorials();
    const script = scripts.find(
      ({ id, type }) => !defaultScriptIds.includes(id) && type === "account",
    );
    const component = components.find(
      ({ scriptId }) => scriptId === script?.id,
    );
    return (
      <NextStepButton
        disabled={!completed}
        onClick={() => {
          if (!component) {
            newComponent({
              name: "Counter Contract",
              type: "account",
              scriptId: script?.id ?? "",
              storageSlots: [{ name: "count_map", type: "map", value: "1:0" }],
            });
          }
          nextTutorialStep();
        }}
      />
    );
  },
};

export default Step2;
