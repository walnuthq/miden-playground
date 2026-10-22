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
  githubRepoUrl: "https://github.com/0xMiden/project-template",
  githubRepoRef: "e941949b1cb244f1557ace1c58dca0dc7a898da8",
  projectDir: "contracts",
  state,
};

export default counterContract;
