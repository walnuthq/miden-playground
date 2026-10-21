import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import Step2Content from "@/components/tutorials/your-first-smart-contract-and-custom-note/step2.mdx";
import useComponents from "@/hooks/use-components";
import useScripts from "@/hooks/use-scripts";
import useTutorials from "@/hooks/use-tutorials";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";
import { storageSlotName } from "@/lib/utils/component";

const useCompleted = () => {
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) =>
      !defaultScriptIds.includes(id) && type === "account-component",
  );
  return script?.status === "compiled";
};

const Step2: TutorialStep = {
  title: "Understand and compile the counter contract script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step2Content />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Compile the counter contract script."
          titleWhenCompleted="You compiled the counter contract script."
          description={
            <p>
              Once you've read the counter contract code, click the{" "}
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
      ({ id, type }) =>
        !defaultScriptIds.includes(id) && type === "account-component",
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
              type: "account-component",
              scriptId: script?.id ?? "",
              storageSlots: [
                {
                  name: storageSlotName({
                    packageName: script?.name ?? "",
                    traitName: "CounterContract",
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
