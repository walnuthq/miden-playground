import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import { InlineCode } from "@/components/tutorials/prose";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step7: TutorialStep = {
  title: "Read the updated counter value.",
  Content: () => (
    <>
      <p>
        Click the <em>"Invoke"</em> button next to the{" "}
        <strong>
          <InlineCode>get_count</InlineCode>
        </strong>{" "}
        procedure again to read the new value of the counter: it should have
        increased by the increment value you set in the contract code.
      </p>
      <p>
        Congratulations! You have successfully written, deployed and interacted
        with your own Miden smart contract on testnet.
      </p>
    </>
  ),
  NextStepButton: NextTutorialButton,
};

export default Step7;
