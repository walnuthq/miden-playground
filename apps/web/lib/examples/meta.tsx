import type { ExampleId, ExampleMeta } from "@/lib/types/example";

// What the home page's cards and the project switcher show of each example,
// apart from its state. On its own so the app shell can render them before
// the SDK loads: the examples' states (accounts, assets) are built with SDK
// helpers, so the full examples (index.ts) can't be in the shell's graph.
// Each example's index.tsx spreads its entry here.
export const exampleMetas: ExampleMeta[] = [
  {
    id: "counter-account",
    title: "Counter Contract",
    tagline: "Deploy a counter contract on testnet and increment it.",
    description: (
      <p>
        A counter written in Miden Assembly: an account component,{" "}
        <code>counter-account</code>, that keeps a count in its storage, and a
        note, <code>increment-note</code>, that increments the count of the
        account that consumes it. The example deploys a counter account for you:
        invoke <code>increment_count</code> from its page, then read the new
        count with <code>get_count</code>.
      </p>
    ),
  },
  {
    id: "bank-account",
    title: "Miden Bank",
    tagline:
      "Deploy a bank contract on testnet, then deposit and withdraw assets.",
    description: (
      <p>
        A bank written in Miden Assembly: an account component,{" "}
        <code>bank-account</code>, that keeps its depositors' assets in its
        vault and their balances in its storage. Deposit with a{" "}
        <code>deposit-note</code>, withdraw with a{" "}
        <code>withdraw-request-note</code>: the bank pays the amount back in a
        P2ID note. The example deploys a bank account for you: run the{" "}
        <code>init-tx-script</code> transaction script on it to enable deposits.
      </p>
    ),
  },
];

// The examples the home page and the Projects switcher offer.
export const shownExampleMetas = exampleMetas.filter(({ hidden }) => !hidden);

export const exampleMeta = (id: ExampleId): ExampleMeta => {
  const meta = exampleMetas.find((meta) => meta.id === id);
  if (!meta) {
    throw new Error(`No entry for example "${id}" in lib/examples/meta.tsx`);
  }
  return meta;
};
