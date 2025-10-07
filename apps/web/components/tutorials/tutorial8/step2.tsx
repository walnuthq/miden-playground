import { usePathname } from "next/navigation";
import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step2Content from "@/components/tutorials/tutorial8/step2.mdx";

const useCompleted = () => {
  const pathname = usePathname();
  return pathname === "/scripts/count-reader";
};

const Step2: TutorialStep = {
  title: "What we will build.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step2Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Click on the script."
          titleWhenCompleted="You navigated to the Count Reader script."
          description={
            <p>
              Click on the <em>"Count Reader"</em> row in the scripts table to
              start reading the script.
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
