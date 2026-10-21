import Step5Content from "@/components/tutorials/foreign-procedure-invocation/step5.mdx";
import NextStepButton from "@/components/tutorials/next-step-button";
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
        <Step5Content />
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
