import { InlineCode, NumberedList } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step3: TutorialStep = {
  title: "Understand the counter note script.",
  Content: () => (
    <>
      <p>
        Now that your network counter is registered on testnet, you'll create a
        public Note that the network transaction builder consumes to increment
        it, from <strong>0</strong> to <strong>1</strong>.
      </p>
      <p>
        Take some time to read the{" "}
        <TutorialLink href="/scripts/counter-note">
          counter-note script
        </TutorialLink>
        . Its{" "}
        <strong>
          <InlineCode>run</InlineCode>
        </strong>{" "}
        procedure, at lines <em>23-29</em>, interacts with the Account that
        consumes the Note, here your network counter:
      </p>
      <NumberedList>
        <li>
          It reads the current count with the{" "}
          <strong>
            <InlineCode>get_count</InlineCode>
          </strong>{" "}
          procedure.
        </li>
        <li>
          It calls the{" "}
          <strong>
            <InlineCode>increment_count</InlineCode>
          </strong>{" "}
          procedure.
        </li>
        <li>
          It computes the expected count and asserts that it's equal to the new
          count returned by{" "}
          <strong>
            <InlineCode>get_count</InlineCode>
          </strong>
          .
        </li>
      </NumberedList>
      <p>
        If the contract didn't implement the increment logic correctly, the
        assertion would fail, and so would the Transaction consuming the Note.
      </p>
      <p>
        A network note is a public Note that carries an attachment identifying
        its target network account. Once the network transaction builder picks
        it up, it executes a Transaction against the target account that
        consumes the Note.
      </p>
    </>
  ),
};

export default Step3;
