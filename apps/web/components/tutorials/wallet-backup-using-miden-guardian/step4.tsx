import { EllipsisVertical } from "lucide-react";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import type { TutorialStep } from "@/lib/types/tutorial";

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
        <p>
          The Note containing your tokens must now be consumed to fund your
          guardian wallet.
        </p>
        <p>
          Unlike a regular wallet, the guardian wallet can't consume the Note
          right away. Every Transaction it executes starts as a{" "}
          <strong>proposal</strong>: a description of the state change that is
          sent to Miden Guardian, so it can keep track of the proposed update
          before co-signing it. Here, you need to create a consume note
          proposal.
        </p>
        <p>
          Click the <EllipsisVertical className="size-4 inline" /> icon button
          in the <em>"Consumable Notes"</em> table and select{" "}
          <em>"Consume note with …"</em> to create a consume note proposal.
        </p>
        <p>
          Approve the <em>"Opaque signature request"</em> prompts in Bread
          Wallet to sign the request sent to Miden Guardian.
        </p>
        <p>
          The Note then disappears from the <em>"Consumable Notes"</em> table,
          as it is now part of the consume note proposal.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create a consume note proposal."
          titleWhenCompleted="Your proposal has been created."
          description={
            <p>
              Click the <EllipsisVertical className="size-4 inline" /> icon
              button in the <em>"Consumable Notes"</em> table of your guardian
              wallet and select <em>"Consume note with …"</em> to create a
              consume note proposal.
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
