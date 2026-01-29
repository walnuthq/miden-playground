import { EllipsisVertical } from "lucide-react";
import { type TutorialStep } from "@/lib/types/tutorial";
import useAccounts from "@/hooks/use-accounts";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step4Content from "@/components/tutorials/tutorial11/step4.mdx";
import { getAddressPart } from "@/lib/utils";

const useCompleted = () => {
  const { connectedWallet } = useAccounts();
  return (
    connectedWallet?.storageMode === "private" &&
    connectedWallet?.consumableNoteIds.length === 0
  );
};

const Step4: TutorialStep = {
  title: "Consume the private note with your private wallet.",
  Content: () => {
    const { connectedWallet } = useAccounts();
    const completed = useCompleted();
    return (
      <>
        <Step4Content
          wallet={
            connectedWallet?.storageMode === "private"
              ? {
                  ...connectedWallet,
                  address: getAddressPart(connectedWallet.address),
                }
              : undefined
          }
        />
        <TutorialAlert
          completed={completed}
          title="Action required: Consume the private note."
          titleWhenCompleted="Your wallet has been privately funded."
          description={
            <p>
              Click on the <EllipsisVertical className="size-4 inline" /> icon
              button on the right-most side of the consumable note row in your
              private wallet page details to consume the note with your wallet.
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
