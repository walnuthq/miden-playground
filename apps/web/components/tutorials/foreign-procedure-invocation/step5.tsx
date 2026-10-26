import NextStepButton from "@/components/tutorials/next-step-button";
import { InlineCode } from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
import { EMPTY_WORD } from "@/lib/constants";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const countReader = accounts.find(({ components }) =>
    components.includes("count-reader"),
  );
  const counter = accounts.find(({ components }) =>
    components.includes("counter-account"),
  );
  if (!countReader || !counter) {
    return false;
  }
  const copyCountTransaction = transactions.find(
    ({ accountId }) => accountId === countReader.id,
  );
  if (!copyCountTransaction) {
    return false;
  }
  const countReaderCount = countReader.storage.find(
    ({ name }) => name === "count_reader::count_reader::count",
  );
  const counterCountMap = counter.storage.find(
    ({ name }) => name === "counter_account::counter_contract::count_map",
  );
  const counterCountMapEntry = counterCountMap?.mapEntries.find(
    ({ key }) =>
      key ===
      "0x0100000000000000000000000000000000000000000000000000000000000000",
  );
  // an unset map entry reads as an empty word
  return countReaderCount?.item === (counterCountMapEntry?.value ?? EMPTY_WORD);
};

const Step5: TutorialStep = {
  title: "Copy the Counter Contract count.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          Your <strong>Count Reader</strong> is deployed, so you can now copy
          the count of the <strong>Counter Contract</strong>, a counter contract
          deployed on testnet that the Playground imported for you in this
          tutorial.
        </p>
        <p>
          Click the <em>"Components"</em> tab on the account details page. Under{" "}
          <em>"Account Components"</em>, find the <em>"Count Reader"</em>{" "}
          component: its{" "}
          <strong>
            <InlineCode>count_reader::count_reader::count</InlineCode>
          </strong>{" "}
          storage slot holds the initial count, <strong>0</strong>.
        </p>
        <p>
          Click the <em>"Invoke"</em> button next to the{" "}
          <strong>
            <InlineCode>copy_count</InlineCode>
          </strong>{" "}
          procedure. In the <em>"Invoke Procedure"</em> dialog, select the{" "}
          <strong>Counter Contract</strong> account as the{" "}
          <strong>
            <InlineCode>counter_account_id</InlineCode>
          </strong>{" "}
          argument, then click the <em>"Invoke"</em> button.
        </p>
        <p>
          The Playground executes a Transaction against your{" "}
          <strong>Count Reader</strong> with a transaction script that calls{" "}
          <strong>
            <InlineCode>copy_count</InlineCode>
          </strong>
          , and submits it to testnet. The <strong>Counter Contract</strong> is
          passed to the Transaction as a foreign account, so that{" "}
          <strong>
            <InlineCode>copy_count</InlineCode>
          </strong>{" "}
          can call its{" "}
          <strong>
            <InlineCode>get_count</InlineCode>
          </strong>{" "}
          procedure through FPI.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Copy the Counter Contract count."
          titleWhenCompleted="Your Count Reader copied the Counter Contract count."
          description={
            <p>
              In the <em>"Components"</em> tab of your Count Reader's details
              page, click the <em>"Invoke"</em> button next to the{" "}
              <strong>copy_count</strong> procedure and select the{" "}
              <strong>Counter Contract</strong> account.
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
