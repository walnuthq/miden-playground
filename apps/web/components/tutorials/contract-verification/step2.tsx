import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step2Content from "@/components/tutorials/contract-verification/step2.mdx";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import useComponents from "@/hooks/use-components";
import useTutorials from "@/hooks/use-tutorials";
import { storageSlotName } from "@/lib/utils/component";

const useCompleted = () => {
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "account",
  );
  const procedureExports = script?.procedureExports ?? [];
  const resetCountProcedure = procedureExports.find(
    ({ digest }) =>
      digest ===
      "0x7d16f4f4c909a3d0d58d0263873e5f2307e60f5d218afeff8af92481945ce36b",
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
              storageSlots: [
                {
                  name: storageSlotName({
                    packageName: script?.name ?? "",
                    componentStruct: "CounterContract",
                    fieldName: "count_map",
                  }),
                  type: "map",
                  value: "1:0",
                },
              ],
            });
          }
          nextTutorialStep();
        }}
      />
    );
  },
};

export default Step2;
