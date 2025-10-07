// import { usePathname } from "next/navigation";
import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step2Content from "@/components/tutorials/tutorial7/step2.mdx";
// import useScripts from "@/hooks/use-scripts";
// import defaultScripts from "@/lib/types/default-scripts";

const Step2: TutorialStep = {
  title: "Title.",
  Content: () => {
    return (
      <>
        <Step2Content />
        <TutorialAlert
          completed={false}
          title="Action required: Create a new script."
          titleWhenCompleted="You created a Counter Note script."
          description={
            <p>
              Click on the <em>"Create new script"</em> button and create a new{" "}
              <strong>Note Script</strong> from the{" "}
              <strong>Counter Note</strong> example.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    return <NextStepButton disabled />;
  },
};

export default Step2;
