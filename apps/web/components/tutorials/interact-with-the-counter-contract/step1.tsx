import { useLocation } from "react-router";
import NextStepButton from "@/components/tutorials/next-step-button";
import { ExternalLink, InlineCode } from "@/components/tutorials/prose";
import TutorialStepAlert from "@/components/tutorials/tutorial-step-alert";
import type { TutorialStep } from "@/lib/types/tutorial";

const useCompleted = () => {
  const { pathname } = useLocation();
  return pathname === "/scripts/counter-value-contract";
};

const Step1: TutorialStep = {
  title: "Open the counter contract script.",
  Content: () => {
    const completed = useCompleted();
    return (
      <>
        <p>
          In this tutorial, you'll use the Miden Playground to interact with a
          counter contract that is already deployed on testnet, and increment
          its count.
        </p>
        <p>
          To do so, you'll execute a Transaction against the contract with a
          transaction script that calls its{" "}
          <strong>
            <InlineCode>increment_count</InlineCode>
          </strong>{" "}
          procedure. This gives you a foundational understanding of how to
          interact with custom smart contracts on Miden.
        </p>
        <p>
          On Miden, a smart contract is an Account with custom{" "}
          <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/code">
            code
          </ExternalLink>
          . This code can be written in Rust and compiled to{" "}
          <ExternalLink href="https://docs.miden.xyz/builder/glossary/#miden-assembly">
            Miden Assembly
          </ExternalLink>{" "}
          (MASM) before being deployed on-chain.
        </p>
        <p>
          Let's start by reading the counter contract code to understand how its{" "}
          <strong>
            <InlineCode>get_count</InlineCode>
          </strong>{" "}
          and{" "}
          <strong>
            <InlineCode>increment_count</InlineCode>
          </strong>{" "}
          procedures are implemented.
        </p>
        <TutorialStepAlert
          completed={completed}
          title="Action required: Open the counter contract script."
          titleWhenCompleted="You opened the counter contract script."
          description={
            <p>
              Click the <em>"counter-contract"</em> row in the scripts table to
              open the script.
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
