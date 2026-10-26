import { usePathname } from "next/navigation";
import CopyButton from "@/components/lib/copy-button";
import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink } from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const pathname = usePathname();
  const { scripts } = useScripts();
  const script = scripts.find(
    ({ id, type }) =>
      !defaultScriptIds.includes(id) && type === "account-component",
  );
  return (
    pathname === `/scripts/${script?.id}` && script?.name === "counter-account"
  );
};

const Step1: TutorialStep = {
  title: "Create the counter contract script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          In the previous tutorials, you deployed a counter contract and
          incremented its counter, first by invoking its procedures, then with a
          network note. In this tutorial, you'll write both sides of this
          interaction: a counter contract, and a custom note script that
          increments the counter of the Account that consumes the Note.
        </p>
        <p>
          You'll learn how both scripts are structured, deploy the counter
          contract on testnet, then create a Note with your note script and
          consume it with the counter contract. This tutorial is based on the{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/get-started/your-first-smart-contract/">
            Your First Smart Contract
          </ExternalLink>{" "}
          guide in the Miden docs, which builds the same contracts in a local
          Rust project.
        </p>
        <p>
          Let's start by creating the script that holds the contract code. Click
          the <em>"Create new script"</em> button, enter{" "}
          <strong>counter-account</strong>{" "}
          <CopyButton content="Copy Script Name" copy="counter-account" /> as
          the name, then select the <strong>Account Component</strong> type and
          the <strong>Counter Contract</strong> example.
        </p>
        <p>
          Your script must be named <strong>counter-account</strong>: the
          Playground creates resources in the next steps, such as the contract's
          storage slot name, that expect this exact name.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create the counter contract script."
          titleWhenCompleted="You created the counter contract script."
          description={
            <p>
              Click the <em>"Create new script"</em> button and create an{" "}
              <strong>Account Component</strong> script named{" "}
              <strong>counter-account</strong> from the{" "}
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
