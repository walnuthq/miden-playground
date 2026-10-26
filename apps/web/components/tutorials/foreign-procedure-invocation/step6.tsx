import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import { InlineCode } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import useAccounts from "@/hooks/use-accounts";
import type { Account } from "@/lib/types/account";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step6Content = ({ counter }: { counter?: Account }) => (
  <>
    <p>
      Your Transaction has been submitted: under <em>"Account Components"</em>,
      the{" "}
      <strong>
        <InlineCode>count_reader::count_reader::count</InlineCode>
      </strong>{" "}
      storage slot of your <strong>Count Reader</strong> now holds a copy of the{" "}
      <strong>Counter Contract</strong> count.
    </p>
    <p>
      To compare them, open the{" "}
      {counter ? (
        <TutorialLink href={`/accounts/${counter?.identifier}`}>
          Counter Contract
        </TutorialLink>
      ) : (
        "Counter Contract"
      )}
      's details page, click the <em>"Components"</em> tab and click the{" "}
      <em>"Invoke"</em> button next to the{" "}
      <strong>
        <InlineCode>get_count</InlineCode>
      </strong>{" "}
      procedure to read its current count.
    </p>
    <p>
      Congratulations! You have successfully used the Miden Playground to
      perform your first foreign procedure invocation.
    </p>
    <p>
      In this tutorial, you deployed a smart contract that calls the{" "}
      <strong>
        <InlineCode>get_count</InlineCode>
      </strong>{" "}
      procedure of the <strong>Counter Contract</strong> through FPI, then saves
      the returned value to its own storage.
    </p>
  </>
);

const Step6: TutorialStep = {
  title: "Read the copied count.",
  Content: () => {
    const { accounts } = useAccounts();
    const counter = accounts.find(({ components }) =>
      components.includes("counter-account"),
    );
    return <Step6Content counter={counter} />;
  },
  NextStepButton: NextTutorialButton,
};

export default Step6;
