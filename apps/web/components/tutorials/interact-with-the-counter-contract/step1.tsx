import { usePathname } from "next/navigation";
import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step1Content from "@/components/tutorials/interact-with-the-counter-contract/step1.mdx";

const useCompleted = () => {
  const pathname = usePathname();
  return pathname === "/scripts/counter-value-contract";
};

const Step1: TutorialStep = {
  title: "Open the counter contract script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step1Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Open the counter contract script."
          titleWhenCompleted="You opened the counter contract script."
          description={
            <p>
              Click the <em>"counter-contract"</em> row in the scripts table to
              open the script.
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
