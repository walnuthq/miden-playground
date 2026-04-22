import { type Example } from "@/lib/types/example";
import { defaultProcedureExport, defaultSignature } from "@/lib/utils/script";
import state from "@/components/home/examples/counter-contract/state";

const counterContract: Example = {
  id: "counter-account",
  title: "Counter Contract",
  tagline: "Create a simple counter contract and interact with it on Miden.",
  description: (
    <p>
      This example serves as the companion code for the{" "}
      <strong>Your First Smart Contract</strong> Rust tutorial in the{" "}
      <a
        className="text-[#ff5500] font-medium underline underline-offset-4"
        href="https://docs.miden.xyz/builder/get-started/your-first-smart-contract"
        target="_blank"
        rel="noreferrer"
      >
        Miden Documentation
      </a>
      .
    </p>
  ),
  githubRepoUrl: "https://github.com/0xMiden/project-template",
  projectDir: "contracts",
  state,
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "get-count",
      digest:
        "0xe589c4b6ed1cdd8213e265f842b3b2f8da8093236a3b75e0d56ec9872fbe2604",
      signature: {
        ...defaultSignature(),
        results: ["Felt"],
      },
      readOnly: true,
    },
    {
      ...defaultProcedureExport(),
      path: "increment-count",
      digest:
        "0xa1fbf768204b8bb3588d273ce7eb666e7304cd9b9ec71bfb8ccada08e4570deb",
      signature: {
        ...defaultSignature(),
        results: ["Felt"],
      },
    },
  ],
};

export default counterContract;
