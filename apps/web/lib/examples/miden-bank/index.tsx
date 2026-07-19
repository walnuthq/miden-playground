import type { Example } from "@/lib/types/example";
import { defaultProcedureExport, defaultSignature } from "@/lib/utils/script";
import state from "@/lib/examples/miden-bank/state";

const midenBank: Example = {
  id: "bank-account",
  title: "Miden Bank",
  tagline:
    "Banking application demonstrating deposits, withdrawals, and asset management.",
  description: (
    <p>
      This example serves as the companion code for the{" "}
      <strong>Building a Bank with Miden</strong> Rust tutorial in the{" "}
      <a
        className="text-[#ff5500] font-medium underline underline-offset-4"
        href="https://docs.miden.xyz/builder/tutorials/miden-bank"
        target="_blank"
        rel="noreferrer"
      >
        Miden Documentation
      </a>
      .
    </p>
  ),
  githubRepoUrl: "https://github.com/0xMiden/tutorials",
  projectDir: "examples/miden-bank/contracts",
  state,
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "get-depositor-balance",
      digest:
        "0x0f882003db8fa3d50a3a41ddc96970410768eeaa5b28974045e6f1c8118080f3",
      signature: {
        ...defaultSignature(),
        params: ["AccountId", "Asset"],
        results: ["Felt"],
      },
      readOnly: true,
    },
    {
      ...defaultProcedureExport(),
      path: "deposit",
      digest:
        "0xa31e727f264e1d841838b3e282bc7a46c30e439cced2e0e30f0e0dc55be630d8",
      signature: {
        ...defaultSignature(),
        params: ["AccountId", "Asset"],
      },
    },
    {
      ...defaultProcedureExport(),
      path: "initialize",
      digest:
        "0x95812a7a11402a155a41036b21f3486ab7619574c5d8abef411594e97e43b0e4",
    },
    {
      ...defaultProcedureExport(),
      path: "withdraw",
      digest:
        "0x291543660e99197e13a5cd76ed7de9fd77eebf2625ac82dd0fb15450e6c1fe50",
      signature: {
        ...defaultSignature(),
        params: ["Asset", "Word", "Felt", "Felt"],
      },
    },
  ],
};

export default midenBank;
