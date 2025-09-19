import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step2Content from "@/components/tutorials/deploy-a-counter-contract/step2.mdx";
import useScripts from "@/hooks/use-scripts";
import defaultScripts from "@/components/global-context/default-scripts";

const Step2: TutorialStep = {
  title: "Compile the Counter Contract script.",
  Content: () => {
    const { scripts } = useScripts();
    const defaultScriptIds = defaultScripts.map(({ id }) => id);
    const script = scripts.find(
      ({ id, type }) => !defaultScriptIds.includes(id) && type === "account"
    );
    const matches = script?.rust.matchAll(/felt!\((\d*)\)/g);
    const lastMatch = Array.from(matches ?? []).at(-1);
    const incrementValue = Number(lastMatch?.at(1));
    return (
      <>
        <Step2Content />
        <TutorialAlert
          completed={script?.masm !== "" && incrementValue > 1}
          title="Action required: Compile the script."
          titleWhenCompleted="You compiled the Counter Contract script."
          description={
            <p>
              Click on the <em>"Compile"</em> button in the editor console to
              compile your script. Change the increment value and make sure to
              not introduce any errors.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const { scripts } = useScripts();
    const defaultScriptIds = defaultScripts.map(({ id }) => id);
    const script = scripts.find(
      ({ id, type }) => !defaultScriptIds.includes(id) && type === "account"
    );
    const matches = script?.rust.matchAll(/felt!\((\d*)\)/g);
    const lastMatch = Array.from(matches ?? []).at(-1);
    const incrementValue = Number(lastMatch?.at(1));
    return (
      <NextStepButton disabled={script?.masm === "" || incrementValue <= 1} />
    );
  },
};

export default Step2;
