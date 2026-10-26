import { BulletList, ExternalLink } from "@/components/tutorials/prose";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step1: TutorialStep = {
  title: "Understand network transactions.",
  Content: () => (
    <>
      <p>
        In this tutorial, you'll explore Network Transactions (NTXs) on Miden, a
        powerful feature that enables autonomous smart contract execution and
        public shared state management. Unlike local transactions, which users
        execute and prove themselves, network transactions are executed and
        proven by the network transaction builder, run by the Miden operator.
      </p>
      <p>
        You'll deploy a network counter contract that uses the same code as the
        counter contract from a previous tutorial, but a different{" "}
        <ExternalLink href="https://docs.miden.xyz/reference/protocol/account/code#authentication">
          authentication component
        </ExternalLink>{" "}
        that lets the network execute Transactions against it.
      </p>
      <p>
        Then, you'll create a Note targeting the network counter and let the
        network transaction builder consume it, which increments the counter.
      </p>
      <p>Network transactions are useful for:</p>
      <BulletList>
        <li>
          <strong>Public shared state</strong>: multiple users can create Notes
          targeting the same contract, and the network transaction builder
          orders their execution.
        </li>
        <li>
          <strong>Autonomous execution</strong>: smart contracts can execute
          when conditions are met, without user intervention.
        </li>
        <li>
          <strong>Resource-constrained devices</strong>: clients that can't
          generate ZK proofs efficiently can rely on the network to do it.
        </li>
        <li>
          <strong>AMM applications</strong>: using network notes, you can build
          sophisticated AMMs where trades execute automatically.
        </li>
      </BulletList>
      <p>
        The trade-off is reduced privacy: the network account's state and the
        Notes it consumes are public, so the operator can see the transaction
        inputs.
      </p>
      <p>
        To learn more, read the{" "}
        <ExternalLink href="https://docs.miden.xyz/builder/tutorials/recipes/rust/network_transactions_tutorial">
          Network Transactions on Miden
        </ExternalLink>{" "}
        tutorial in the Miden docs.
      </p>
    </>
  ),
};

export default Step1;
