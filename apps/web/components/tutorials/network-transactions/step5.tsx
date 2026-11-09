import useNetworkCounter, {
  COUNTER_SLOT_NAME,
} from "@/components/tutorials/network-transactions/use-network-counter";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import { InlineCode } from "@/components/tutorials/prose";
import TutorialLink from "@/components/tutorials/tutorial-link";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step5: TutorialStep = {
  title: "Read the updated counter value.",
  Content: () => {
    const { counter } = useNetworkCounter();
    return (
      <>
        <p>
          Your Note has been consumed by a network transaction, which
          incremented the network counter from <strong>0</strong> to{" "}
          <strong>1</strong>.
        </p>
        <p>
          Open the{" "}
          <TutorialLink
            href={counter ? `/accounts/${counter.identifier}` : "/accounts"}
          >
            network counter
          </TutorialLink>
          's page and click the <em>"Components"</em> tab. Under{" "}
          <em>"Account Components"</em>, click the <em>"Invoke"</em> button next
          to the{" "}
          <strong>
            <InlineCode>get_count</InlineCode>
          </strong>{" "}
          procedure: it returns <strong>1</strong>. This procedure only reads
          storage, so the Playground executes it locally, without submitting a
          Transaction, which is why you can invoke it on a network account.{" "}
          <strong>
            <InlineCode>increment_count</InlineCode>
          </strong>{" "}
          has no such button: it updates the Account, which only the network can
          do.
        </p>
        <p>
          The count also shows in the component's storage slots: the{" "}
          <strong className="wrap-anywhere">
            <InlineCode>{COUNTER_SLOT_NAME}</InlineCode>
          </strong>{" "}
          slot now holds <strong>1</strong> under key <strong>1</strong>.
        </p>
        <p>
          Congratulations! You have successfully deployed a network smart
          contract and triggered a network transaction with a custom note.
        </p>
      </>
    );
  },
  NextStepButton: NextTutorialButton,
};

export default Step5;
