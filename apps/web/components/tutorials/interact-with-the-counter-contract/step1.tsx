import { usePathname } from "next/navigation";
import { type TutorialStep } from "@/lib/types";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step1Content from "@/components/tutorials/interact-with-the-counter-contract/step1.mdx";

const Step1: TutorialStep = {
  title: "Learn about Smart Contract scripts.",
  Content: () => {
    const pathname = usePathname();
    return (
      <>
        <Step1Content />
        <TutorialAlert
          completed={pathname === "/scripts/counter-contract"}
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
    const pathname = usePathname();
    return (
      <NextStepButton disabled={pathname !== "/scripts/counter-contract"} />
    );
  },
};

export default Step1;
