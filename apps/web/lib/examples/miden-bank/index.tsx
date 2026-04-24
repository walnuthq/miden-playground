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
        "0x107340abda40a4ec5c6dff5bcba2cc52373cce52affdd29e8bf7a6fd2eb37a14",
      signature: {
        ...defaultSignature(),
        params: ["AccountId", "AccountId"],
        results: ["Felt"],
      },
      readOnly: true,
    },
    {
      ...defaultProcedureExport(),
      path: "deposit",
      digest:
        "0x4af6b8b449bbe5c8073a405fdfee3876010abfb4d69c0646fd09f01d1df6f8f2",
      signature: {
        ...defaultSignature(),
        params: ["AccountId", "Asset"],
      },
    },
    {
      ...defaultProcedureExport(),
      path: "initialize",
      digest:
        "0x02e5121dbb7b358b8629ed37686e1b3d8924d29005633873dd828d1cdf5e8404",
    },
    {
      ...defaultProcedureExport(),
      path: "withdraw",
      digest:
        "0x0de776130f49fd0880904ff8cd964aeab8fbd454bef29dbd251766b2555408e0",
      signature: {
        ...defaultSignature(),
        params: ["AccountId", "Asset", "Word", "Felt", "Felt"],
      },
    },
  ],
};

export default midenBank;
