import type { Example } from "@/lib/types/example";
import { defaultProcedureExport, defaultSignature } from "@/lib/utils/script";
import state from "@/components/home/examples/miden-bank/state";

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
        href="https://docs.miden.xyz/builder/tutorials/rust-compiler/miden-bank/"
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
      path: "get-balance",
      digest:
        "0x583ef74b80f6a62f60b99c1a6c466f1b363ba120e36987f15b69b092ec697a3e",
      signature: {
        ...defaultSignature(),
        params: ["AccountId"],
      },
      readOnly: true,
    },
    {
      ...defaultProcedureExport(),
      path: "deposit",
      digest:
        "0x2db33b47fc363b27b5e55cebcb9dc1d0f916cf1be71be38e2ef87cd65558b0cd",
      signature: {
        ...defaultSignature(),
        params: ["AccountId", "Asset"],
      },
    },
    {
      ...defaultProcedureExport(),
      path: "initialize",
      digest:
        "0xaf2c9810a3899fd82bdfe1710ddc67efe146f2b2202d525c74d2ee0e42430807",
    },
    {
      ...defaultProcedureExport(),
      path: "withdraw",
      digest:
        "0x4da9ccc289b315fece220f22b5625b289d7068c5bfc6c10d8866fba1260403df",
      signature: {
        ...defaultSignature(),
        params: ["AccountId", "Asset", "Word", "Felt", "Felt"],
      },
    },
  ],
};

export default midenBank;
