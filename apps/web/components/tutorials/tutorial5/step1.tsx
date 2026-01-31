import { usePathname } from "next/navigation";
import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step1Content from "@/components/tutorials/tutorial5/step1.mdx";

const useCompleted = () => {
  const pathname = usePathname();
  return pathname === "/scripts/counter-value-contract";
};

const Step1: TutorialStep = {
  title: "Learn about Smart Contract scripts.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step1Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Click on the script."
          titleWhenCompleted="You navigated to the Counter Contract script."
          description={
            <p>
              Click on the <em>"Counter Contract"</em> row in the scripts table
              to start reading the script.
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
