import { type TutorialStep } from "@/lib/types";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step4Content from "@/components/tutorials/interact-with-the-counter-contract/step4.mdx";
import useScripts from "@/hooks/use-scripts";

const Step4: TutorialStep = {
  title: "Invoke the Counter Contract procedures.",
  Content: () => {
    // TODO completed
    const { scripts } = useScripts();
    const script = scripts.find(({ id }) => id === "counter-contract");
    return (
      <>
        <Step4Content />
        <TutorialAlert
          completed={script?.updatedAt !== 0}
          title="Action required: Invoke the procedure."
          titleWhenCompleted="You have invoked the Counter Contract procedures."
          description={
            <p>
              Click on the <em>"Invoke"</em> button in the <em>"Components"</em>{" "}
              section of the account details page to invoke the{" "}
              <strong>increment_count</strong> procedure.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    // TODO disabled
    const { scripts } = useScripts();
    const script = scripts.find(({ id }) => id === "counter-contract");
    return <NextStepButton disabled={script?.updatedAt === 0} />;
  },
};

export default Step4;
