import { EllipsisVertical } from "lucide-react";
import type { TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step5Content from "@/components/tutorials/tutorial4/step5.mdx";

const useCompleted = () => {
  const { connectedWallet } = useAccounts();
  return (
    connectedWallet?.storageMode === "public" &&
    connectedWallet?.consumableNoteIds.length === 0
  );
};

const Step6: TutorialStep = {
  title: "Consume the private note with your public wallet.",
  Content: () => {
    const { connectedWallet } = useAccounts();
    const completed = useCompleted();
    return (
      <>
        <Step5Content
          wallet={
            connectedWallet?.storageMode === "public"
              ? connectedWallet
              : undefined
          }
        />
        <TutorialAlert
          completed={completed}
          title="Action required: Consume the private note."
          titleWhenCompleted="Your received a private transfer."
          description={
            <p>
              Click on the <EllipsisVertical className="size-4 inline" /> icon
              button on the right-most side of the consumable note row in your
              public wallet page details to consume the note with your wallet.
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
