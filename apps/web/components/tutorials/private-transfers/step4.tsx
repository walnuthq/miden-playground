import { EllipsisVertical } from "lucide-react";
import type { TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import Step4Content from "@/components/tutorials/private-transfers/step4.mdx";
import useTransferNote from "@/components/tutorials/private-transfers/use-transfer-note";

const useCompleted = () => {
  const note = useTransferNote();
  return note?.state === "committed" || !!note?.state.startsWith("consumed-");
};

const Step4: TutorialStep = {
  title: "Send tokens privately to your Para Wallet.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step4Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Send tokens to your Para Wallet."
          titleWhenCompleted="The private note carrying your tokens has been created."
          description={
            <p>
              Disconnect Para Wallet and reconnect Bread Wallet. Then click the{" "}
              <EllipsisVertical className="size-4 inline" /> icon button in your
              Bread Wallet's row on the accounts page and select the{" "}
              <em>"New send transaction"</em> option. Send at least 1 USDCx to
              the Para Wallet in a private note, then confirm the transaction in
              Bread Wallet.
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
