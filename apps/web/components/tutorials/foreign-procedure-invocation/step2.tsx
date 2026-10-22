import { usePathname } from "next/navigation";
import Step2Content from "@/components/tutorials/foreign-procedure-invocation/step2.mdx";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const pathname = usePathname();
  return pathname === "/scripts/count-reader";
};

const Step2: TutorialStep = {
  title: "Open the Count Reader script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step2Content />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Open the Count Reader script."
          titleWhenCompleted="You opened the Count Reader script."
          description={
            <p>
              Click the <em>"count-reader"</em> row in the scripts table to open
              the script.
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
