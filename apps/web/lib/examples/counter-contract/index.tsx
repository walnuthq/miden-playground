import state from "@/lib/examples/counter-contract/state";
import type { Example } from "@/lib/types/example";

const counterContract: Example = {
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
  state,
};

export default counterContract;
