import { usePathname } from "next/navigation";
import CopyButton from "@/components/lib/copy-button";
import useScriptName from "@/components/tutorials/contract-verification/use-script-name";
import NextStepButton from "@/components/tutorials/next-step-button";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const pathname = usePathname();
  const { scripts } = useScripts();
  const scriptName = useScriptName();
  const script = scripts.find(
    ({ id, type }) =>
      !defaultScriptIds.includes(id) && type === "account-component",
  );
  return pathname === `/scripts/${script?.id}` && script?.name === scriptName;
};

const Step1Content = ({ scriptName }: { scriptName: string }) => (
  <>
    <p>
      In the previous tutorial, you wrote your own counter contract and deployed
      it on testnet. In this tutorial, you'll learn what contract verification
      is and why it matters.
    </p>
    <p>
      Contract verification proves that the code of a contract deployed on-chain
      was built from a given source code. Once a contract is verified, anyone
      can read its source code, check that it does what it claims to do, and
      call its procedures without having to trust its author. It's a foundation
      for building trust in on-chain applications.
    </p>
    <p>
      Let's start by creating the script that holds the contract code. Click the{" "}
      <em>"Create new script"</em> button, enter <strong>{scriptName}</strong>{" "}
      <CopyButton content="Copy Script Name" copy={scriptName} /> as the name,
      then select the <strong>Account Component</strong> type and the{" "}
      <strong>Counter Contract</strong> example.
    </p>
    <p>
      Your script must be named <strong>{scriptName}</strong>: the Playground
      creates resources in the next steps, such as the contract's storage slot
      name, that expect this exact name. The random suffix is unique to your run
      of this tutorial. The script name ends up in your contract's code, so
      nobody else will have deployed, let alone verified, the exact same
      contract before you.
    </p>
  </>
);

const Step1: TutorialStep = {
  title: "Create the counter contract script.",
  Content: () => {
    const completed = useCompleted();
    const scriptName = useScriptName();
    return (
      <>
        <Step1Content scriptName={scriptName} />
        <TutorialStepAlert
          completed={completed}
          title="Action required: Create the counter contract script."
          titleWhenCompleted="You created the counter contract script."
          description={
            <p>
              Click the <em>"Create new script"</em> button and create an{" "}
              <strong>Account Component</strong> script named{" "}
              <strong>{scriptName}</strong> from the{" "}
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
