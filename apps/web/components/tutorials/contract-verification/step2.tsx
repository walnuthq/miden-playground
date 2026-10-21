import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import Step2Content from "@/components/tutorials/contract-verification/step2.mdx";
import useScripts from "@/hooks/use-scripts";
import useScriptName from "@/components/tutorials/contract-verification/use-script-name";
import useComponents from "@/hooks/use-components";
import useTutorials from "@/hooks/use-tutorials";
import { storageSlotName } from "@/lib/utils/component";

const useScript = () => {
  const { scripts } = useScripts();
  const scriptName = useScriptName();
  return scripts.find(
    ({ name, type }) => name === scriptName && type === "account-component",
  );
};

const useCompleted = () => {
  const script = useScript();
  const procedureExports = script?.procedureExports ?? [];
  // The procedure digests depend on the script name, which is unique to each
  // run, so look for a `reset_count` export taking and returning nothing.
  const resetCountProcedure = procedureExports.find(
    ({ path, signature }) =>
      path.endsWith('::"reset-count"') &&
      signature.params.length === 0 &&
      signature.results.length === 0,
  );
  return script?.status === "compiled" && !!resetCountProcedure;
};

const Step2: TutorialStep = {
  title: "Add a procedure and compile the script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step2Content />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Add the reset_count procedure and compile."
          titleWhenCompleted="You compiled the script."
          description={
            <p>
              Add the <strong>reset_count</strong> procedure to the{" "}
              <strong>CounterContract</strong> trait and its implementation,
              then click the <em>"Compile"</em> button.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    const script = useScript();
    const { components, newComponent } = useComponents();
    const { nextTutorialStep } = useTutorials();
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
