import { usePathname } from "next/navigation";
import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step1Content from "@/components/tutorials/deploy-a-counter-contract/step1.mdx";
import useScripts from "@/hooks/use-scripts";
import defaultScripts from "@/components/global-context/default-scripts";

const Step1: TutorialStep = {
  title: "Create a new script from the Counter Contract example.",
  Content: () => {
    const pathname = usePathname();
    const { scripts } = useScripts();
    const defaultScriptIds = defaultScripts.map(({ id }) => id);
    const script = scripts.find(
      ({ id, type }) => !defaultScriptIds.includes(id) && type === "account"
    );
    return (
      <>
        <Step1Content />
        <TutorialAlert
          completed={pathname === `/scripts/${script?.id}`}
          title="Action required: Create a new script."
          titleWhenCompleted="You created a Counter Contract script."
          description={
            <p>
              Click on the <em>"Create new script"</em> button and create a new{" "}
              <strong>Account Script</strong> from the{" "}
              <strong>Counter Contract</strong> example.
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
      ({ id, type }) => !defaultScriptIds.includes(id) && type === "account"
    );
    return <NextStepButton disabled={pathname !== `/scripts/${script?.id}`} />;
  },
};

export default Step1;
