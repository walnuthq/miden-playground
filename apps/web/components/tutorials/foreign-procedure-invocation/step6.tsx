import Step6Content from "@/components/tutorials/foreign-procedure-invocation/step6.mdx";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import useAccounts from "@/hooks/use-accounts";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step6: TutorialStep = {
  title: "Read the copied count.",
  Content: () => {
    const { accounts } = useAccounts();
    const counter = accounts.find(({ components }) =>
      components.includes("counter-account"),
    );
    return <Step6Content counter={counter} />;
  },
  NextStepButton: NextTutorialButton,
};

export default Step6;
