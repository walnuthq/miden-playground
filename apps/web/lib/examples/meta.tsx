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
        This example is the companion code of the{" "}
        <strong>Your First Smart Contract</strong> tutorial in the{" "}
        <a
          className="text-[#ff5500] font-medium underline underline-offset-4"
          href="https://docs.miden.xyz/builder/get-started/your-first-smart-contract"
          target="_blank"
          rel="noreferrer"
        >
          Miden documentation
        </a>
        .
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
        This example is the companion code of the{" "}
        <strong>Building a Bank with Miden Rust</strong> tutorial in the{" "}
        <a
          className="text-[#ff5500] font-medium underline underline-offset-4"
          href="https://docs.miden.xyz/builder/tutorials/miden-bank"
          target="_blank"
          rel="noreferrer"
        >
          Miden documentation
        </a>
        . Initialize the bank with the <code>init-tx-script</code> transaction
        script before making deposits.
      </p>
    ),
  },
];

export const exampleMeta = (id: ExampleId): ExampleMeta => {
  const meta = exampleMetas.find((meta) => meta.id === id);
  if (!meta) {
    throw new Error(`No entry for example "${id}" in lib/examples/meta.tsx`);
  }
  return meta;
};
