import { EllipsisVertical } from "lucide-react";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step6Content from "@/components/tutorials/tutorial12/step6.mdx";

const useCompleted = () => {
  const { multisigs } = useAccounts();
  return multisigs.length === 0;
};

const Step6: TutorialStep = {
  title: "Delete the multisig account.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step6Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Delete the multisig."
          titleWhenCompleted="Your multisig has been deleted."
          description={
            <p>
              Click on the <EllipsisVertical className="size-4 inline" /> icon
              button on the right-most side of the multisig account row in the
              accounts page to delete your multisig wallet.
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

export default Step6;
