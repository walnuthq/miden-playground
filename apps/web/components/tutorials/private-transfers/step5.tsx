import { EllipsisVertical } from "lucide-react";
import type { TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step5Content from "@/components/tutorials/private-transfers/step5.mdx";
import useTransferNote from "@/components/tutorials/private-transfers/use-transfer-note";

const useCompleted = () => {
  const note = useTransferNote();
  return !!note?.state.startsWith("consumed-");
};

const Step5: TutorialStep = {
  title: "Consume the private note with your Para Wallet.",
  Content: () => {
    const { wallets } = useAccounts();
    const note = useTransferNote();
    const completed = useCompleted();
    return (
      <>
        <Step5Content
          wallet={wallets.find(({ name }) => name === "Para Wallet")}
          noteId={note?.id}
        />
        <TutorialAlert
          completed={completed}
          title="Action required: Consume the private note."
          titleWhenCompleted="Your Para Wallet received a private transfer."
          description={
            <p>
              Disconnect Bread Wallet and reconnect Para Wallet. Then click the{" "}
              <EllipsisVertical className="size-4 inline" /> icon button in the{" "}
              <em>"Consumable Notes"</em> table of your Para Wallet details page
              and select <em>"Consume note with Para Wallet"</em>.
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
