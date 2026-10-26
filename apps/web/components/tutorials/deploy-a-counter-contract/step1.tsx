import { usePathname } from "next/navigation";
import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink } from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useScripts from "@/hooks/use-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const pathname = usePathname();
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) =>
      id.startsWith("counter-account_") && type === "account-component",
  );
  return pathname === `/scripts/${script?.id}`;
};

const Step1: TutorialStep = {
  title: "Create the counter contract script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          In the previous tutorial, you interacted with a counter contract that
          was already deployed on testnet. In this tutorial, you'll build your
          own counter contract, deploy it on testnet and increment its counter.
        </p>
        <p>
          To do so, you'll write the contract code in a script, turn it into an{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/components">
            account component
          </ExternalLink>{" "}
          with its own storage layout, and deploy a new Account that uses this
          component. This gives you a foundational understanding of how custom
          smart contracts are developed and deployed on Miden.
        </p>
        <p>
          Let's start by creating the script that holds the contract code. Click
          the <em>"Create new script"</em> button, enter a name, then select the{" "}
          <strong>Account Component</strong> type and the{" "}
          <strong>Counter Contract</strong> example.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create the counter contract script."
          titleWhenCompleted="You created the counter contract script."
          description={
            <p>
              Click the <em>"Create new script"</em> button and create an{" "}
              <strong>Account Component</strong> script from the{" "}
              <strong>Counter Contract</strong> example.
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

export default Step1;
