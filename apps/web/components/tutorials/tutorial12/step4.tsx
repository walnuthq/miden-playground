import { EllipsisVertical } from "lucide-react";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step4Content from "@/components/tutorials/tutorial12/step4.mdx";

const useCompleted = () => {
  const { multisigs } = useAccounts();
  const [multisig] = multisigs;
  const proposal = multisig?.multisig?.proposals.find(
    (proposal) => proposal.metadata.proposalType === "consume_notes",
  );
  return !!proposal;
};

const Step4: TutorialStep = {
  title: "Create a consume note proposal.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step4Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Create a consume note proposal."
          titleWhenCompleted="Your proposal has been created."
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

export default Step4;
