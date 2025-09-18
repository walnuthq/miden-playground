import { EllipsisVertical } from "lucide-react";
import { type TutorialStep } from "@/lib/types/tutorial";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step5Content from "@/components/tutorials/connect-wallet-and-sign-transactions/step5.mdx";

const Step5: TutorialStep = {
  title: "Send tokens to the recipient wallet.",
  Content: () => {
    // TODO completed
    return (
      <>
        <Step5Content />
        <TutorialAlert
          completed={false}
          title="Action required: Send tokens to recipient."
          titleWhenCompleted="Output note with sent tokens created."
          description={
            <p>
              Click on the <EllipsisVertical className="size-4 inline" /> icon
              button on your wallet row in the accounts page and select the{" "}
              <em>"New send transaction"</em> option. Configure and sign a send
              transaction to the recipient wallet to finish this tutorial.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    // TODO disabled
    return <NextStepButton disabled={false} />;
  },
};

export default Step5;
