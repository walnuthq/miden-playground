import { usePathname } from "next/navigation";
import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step1Content from "@/components/tutorials/tutorial7/step1.mdx";
import useScripts from "@/hooks/use-scripts";
import defaultScripts from "@/lib/types/default-scripts";

const Step1: TutorialStep = {
  title: "Create a new script from the Counter Note example.",
  Content: () => {
    const pathname = usePathname();
    const { scripts } = useScripts();
    const defaultScriptIds = defaultScripts.map(({ id }) => id);
    const script = scripts.find(
      ({ id, type }) => !defaultScriptIds.includes(id) && type === "note"
    );
    return (
      <>
        <Step1Content />
        <TutorialAlert
          completed={pathname === `/scripts/${script?.id}`}
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
    const pathname = usePathname();
    const { scripts } = useScripts();
    const defaultScriptIds = defaultScripts.map(({ id }) => id);
    const script = scripts.find(
      ({ id, type }) => !defaultScriptIds.includes(id) && type === "note"
    );
    return <NextStepButton disabled={pathname !== `/scripts/${script?.id}`} />;
  },
};

export default Step1;
