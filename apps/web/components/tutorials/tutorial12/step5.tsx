import { EllipsisVertical } from "lucide-react";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step5Content from "@/components/tutorials/tutorial12/step5.mdx";

const useCompleted = () => {
  const { multisigs } = useAccounts();
  const [multisig] = multisigs;
  const nonce = multisig?.nonce ?? 0;
  return nonce > 0;
};

const Step5: TutorialStep = {
  title: "Sign and execute the proposal.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step5Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Sign and execute the proposal."
          titleWhenCompleted="Your proposal has been executed."
          description={
            <p>
              Click on the <EllipsisVertical className="size-4 inline" /> icon
              button on the right-most side of the consumable note row in your
              account page details to consume the note with your wallet.
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

export default Step5;
