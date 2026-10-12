import { usePathname } from "next/navigation";
import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step2Content from "@/components/tutorials/foreign-procedure-invocation/step2.mdx";

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
        <TutorialAlert
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
