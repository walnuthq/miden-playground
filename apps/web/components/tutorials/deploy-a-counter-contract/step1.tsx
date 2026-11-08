import { Plus } from "lucide-react";
import { useLocation } from "react-router";
import useCounter from "@/components/tutorials/deploy-a-counter-contract/use-counter";
import NextStepButton from "@/components/tutorials/next-step-button";
import { ButtonName, ExternalLink } from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { pathname } = useLocation();
  const { script } = useCounter();
  return !!script && pathname === `/scripts/${script.id}`;
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
          own from the same code, deploy it on testnet and increment its
          counter.
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
          the <ButtonName icon={Plus}>Create new script</ButtonName> button,
          enter a name, then select the <strong>Account Component</strong> type
          and the <strong>Counter Contract</strong> example.
        </p>
        <p>
          The name is yours to choose, for example <strong>my-counter</strong>.
          It becomes the name of the package your code compiles to, and you'll
          meet it again in the name of the contract's storage slot.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create the counter contract script."
          titleWhenCompleted="You created the counter contract script."
          description={
            <p>
              Click the <ButtonName icon={Plus}>Create new script</ButtonName>{" "}
              button and create an <strong>Account Component</strong> script
              from the <strong>Counter Contract</strong> example.
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
