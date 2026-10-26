import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import { InlineCode, NumberedList } from "@/components/tutorials/prose";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step8: TutorialStep = {
  title: "Read the updated counter value.",
  Content: () => (
    <>
      <p>
        Click the <em>"Components"</em> tab of your counter contract's details
        page, then click the <em>"Invoke"</em> button next to the{" "}
        <strong>
          <InlineCode>get_count</InlineCode>
        </strong>{" "}
        procedure to read the new value of the counter: it should have increased
        from <strong>0</strong> to <strong>1</strong>.
      </p>
      <p>This tutorial demonstrates Miden's deployment flow:</p>
      <NumberedList>
        <li>
          <strong>Contract building</strong>: you compiled both the counter
          contract and the increment note script.
        </li>
        <li>
          <strong>Account creation</strong>: you deployed the counter contract
          with its initial storage (counter value = 0). On Miden, an Account
          isn't deployed by a dedicated transaction: its first Transaction,
          which funded it here, registered it on testnet with the counter still
          at zero.
        </li>
        <li>
          <strong>Note publishing</strong>: you created an increment note and
          published it on testnet.
        </li>
        <li>
          <strong>Note consumption</strong>: the counter contract consumed the
          Note, executing the increment logic.
        </li>
        <li>
          <strong>State update</strong>: the counter value increased and the
          change was recorded on-chain.
        </li>
      </NumberedList>
      <p>
        Congratulations! You have successfully written, deployed and interacted
        with your own Miden smart contract and custom note on testnet.
      </p>
    </>
  ),
  NextStepButton: NextTutorialButton,
};

export default Step8;
