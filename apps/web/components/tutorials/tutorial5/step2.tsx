import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step2Content from "@/components/tutorials/tutorial5/step2.mdx";
import useScripts from "@/hooks/use-scripts";

const useCompleted = () => {
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) => id.startsWith("counter-contract_") && type === "account"
  );
  const matches = script?.rust.matchAll(/felt!\((\d*)\)/g);
  const lastMatch = Array.from(matches ?? []).at(-1);
  const incrementValue = Number(lastMatch?.at(1));
  return script?.masm !== "" && incrementValue > 1;
};

const Step2: TutorialStep = {
  title: "Compile the Counter Contract script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step2Content />
        <TutorialAlert
          completed={completed}
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
    const completed = useCompleted();
    return <NextStepButton disabled={!completed} />;
  },
};

export default Step2;
