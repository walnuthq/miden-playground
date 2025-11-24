import { defaultTutorialStep } from "@/lib/types/tutorial";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import NextStepButton from "@/components/tutorials/next-step-button";
import Step5Content from "@/components/tutorials/tutorial8/step5.mdx";
import useAccounts from "@/hooks/use-accounts";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const countReader = accounts.find(({ components }) =>
    components.includes("count-reader")
  );
  const counter = accounts.find(({ components }) =>
    components.includes("counter-contract")
  );
  if (!countReader || !counter) {
    return false;
  }
  return countReader.storage[0] === counter.storage[0];
};

export default {
  ...defaultTutorialStep(),
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
