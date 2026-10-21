import Step2Content from "@/components/tutorials/deploy-a-counter-contract/step2.mdx";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useScripts from "@/hooks/use-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) =>
      id.startsWith("counter-account_") && type === "account-component",
  );
  const matches = script?.rust.matchAll(/felt!\((\d*)\)/g);
  const lastMatch = Array.from(matches ?? []).at(-1);
  const incrementValue = Number(lastMatch?.at(1));
  return script?.masm !== "" && incrementValue > 1;
};

const Step2: TutorialStep = {
  title: "Customize and compile the counter contract script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step2Content />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Change the increment value and compile the script."
          titleWhenCompleted="You compiled your counter contract script."
          description={
            <p>
              Change the increment value to a number greater than{" "}
              <strong>1</strong>, then click the <em>"Compile"</em> button in
              the editor console to compile your script.
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
