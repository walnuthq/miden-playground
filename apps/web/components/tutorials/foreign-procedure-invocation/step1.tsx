import { ExternalLink } from "@/components/tutorials/prose";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step1: TutorialStep = {
  title: "Understand foreign procedure invocation.",
  Content: () => (
    <>
      <p>
        In the previous tutorials, you interacted with a counter contract
        deployed on testnet and deployed your own. In this tutorial, you'll
        learn the basics of <strong>foreign procedure invocation</strong> (FPI)
        using the Miden Playground.
      </p>
      <p>
        To demonstrate FPI, you'll deploy a <strong>Count Reader</strong> smart
        contract that reads the count of a counter contract deployed on testnet
        and copies it to its own storage.
      </p>
      <p>
        FPI is a powerful tool for building composable smart contracts on Miden:
        it allows one smart contract or Note to read the state of another
        contract.
      </p>
      <p>
        The term "foreign procedure invocation" might sound a bit verbose, but
        it's as simple as one smart contract calling a non-state-modifying
        procedure in another smart contract. The EVM equivalent of FPI would be
        a smart contract calling a read-only function in another contract.
      </p>
      <p>
        FPI is useful for developing smart contracts that extend the
        functionality of existing contracts on Miden. It's also the core
        primitive used by price oracles on Miden.
      </p>
      <p>
        To learn more, read the{" "}
        <ExternalLink href="https://docs.miden.xyz/builder/tutorials/recipes/web/foreign_procedure_invocation_tutorial">
          Foreign Procedure Invocation
        </ExternalLink>{" "}
        tutorial in the Miden docs.
      </p>
    </>
  ),
};

export default Step1;
