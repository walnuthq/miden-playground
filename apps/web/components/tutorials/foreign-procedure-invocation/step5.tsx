import type { TutorialStep } from "@/lib/types/tutorial";
import TutorialAlert from "@/components/tutorials/tutorial-step-alert";
import NextStepButton from "@/components/tutorials/next-step-button";
import Step5Content from "@/components/tutorials/foreign-procedure-invocation/step5.mdx";
import useAccounts from "@/hooks/use-accounts";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const countReader = accounts.find(({ components }) =>
    components.includes("count-reader"),
  );
  const counter = accounts.find(({ components }) =>
    components.includes("counter-account"),
  );
  if (!countReader || !counter) {
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
  return countReaderCount?.item === counterCountMapEntry?.value;
};

const Step5: TutorialStep = {
  title: "Copy the count from the Counter contract.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <Step5Content />
        <TutorialAlert
          completed={completed}
          title="Action required: Invoke the copy count procedure."
          titleWhenCompleted="You invoked the copy count procedure."
          description={
            <p>
              Click on the <em>"Invoke"</em> button and call the{" "}
              <strong>copy_count</strong> procedure with the correct parameters.
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
