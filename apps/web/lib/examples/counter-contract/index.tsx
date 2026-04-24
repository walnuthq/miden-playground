import type { Example } from "@/lib/types/example";
import { defaultProcedureExport, defaultSignature } from "@/lib/utils/script";
import state from "@/lib/examples/counter-contract/state";

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
        "0xc8a31db7968e83b2c446d0fcbfabbab5fd752d22d31e293eafe11e018e9cc7a3",
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
        "0x630aff54c6265d5847a1f8ce3e007bf2c3e0753edb548a0241387cd6fdc7e386",
      signature: {
        ...defaultSignature(),
        results: ["Felt"],
      },
    },
  ],
};

export default counterContract;
