import { usePathname } from "next/navigation";
import NextStepButton from "@/components/tutorials/next-step-button";
import Step1Content from "@/components/tutorials/timelock-p2id-note/step1.mdx";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const pathname = usePathname();
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "note",
  );
  return pathname === `/scripts/${script?.id}`;
};

const Step1: TutorialStep = {
  title: "Create a new script from the P2ID Note example.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step1Content />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create a new script."
          titleWhenCompleted="You created a P2ID note script."
          description={
            <p>
              Click the <em>"Create new script"</em> button and create a new{" "}
              <strong>Note Script</strong> from the <strong>P2ID Note</strong>{" "}
              example.
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

export default Step1;
