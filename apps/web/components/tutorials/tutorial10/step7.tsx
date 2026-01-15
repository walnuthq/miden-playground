import { type TutorialStep } from "@/lib/types/tutorial";
import NextTutorialButton from "@/components/tutorials/next-tutorial-button";
import TutorialAlert from "@/components/tutorials/tutorial-alert";
import Step7Content from "@/components/tutorials/tutorial10/step7.mdx";
import useAccounts from "@/hooks/use-accounts";

const useCompleted = () => {
  const { accounts } = useAccounts();
  const counter = accounts.find(({ name }) => name === "Unverified Contract");
  const nonce = counter?.nonce ?? 0;
  return nonce > 0;
};

const Step7: TutorialStep = {
  title: "Interact with the verified contract.",
  Content: () => {
    const completed = useCompleted();
    const { accounts } = useAccounts();
    const counter = accounts.find(({ name }) => name === "Unverified Contract");
    return (
      <>
        <Step7Content counter={counter} />
        <TutorialAlert
          completed={completed}
          title="Action required: Interact with the contract."
          titleWhenCompleted="You interacted with the contract."
          description={
            <p>
              Click on the <em>"Invoke"</em> button next to the{" "}
              <strong>increment-count</strong> procedure to interact with the
              verified contract.
            </p>
          }
        />
      </>
    );
  },
  NextStepButton: () => {
    const completed = useCompleted();
    return <NextTutorialButton disabled={!completed} />;
  },
};

export default Step7;
