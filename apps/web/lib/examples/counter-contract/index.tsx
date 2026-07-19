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
        "0x68a422b3714a8aecc62577beca2368591f90a583e780722f36e7d97eb3e7a393",
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
        "0x498ac7ba8d658a2cf6cdf17f813da473368a8809b2de7cc88520610b5ba651e6",
      signature: {
        ...defaultSignature(),
        results: ["Felt"],
      },
    },
  ],
};

export default counterContract;
