// The examples launched from the web app's home page. Their sources are
// copies of upstream projects, edited here as needed, and compiled.json holds
// their initial compile output (regenerate it with `pnpm examples:compile`,
// see scripts/compile-examples.ts), so launching an example needs no
// api-compile round trip. The sources are bundled as strings by the Text rule
// in wrangler.jsonc.

import counterContractCompiled from "@/examples/counter-contract/compiled.json";
import counterAccountToml from "@/examples/counter-contract/counter-account/miden-project.toml";
import counterAccountRust from "@/examples/counter-contract/counter-account/src/lib.rs";
import incrementNoteToml from "@/examples/counter-contract/increment-note/miden-project.toml";
import incrementNoteRust from "@/examples/counter-contract/increment-note/src/lib.rs";
import type { ExampleSources } from "@/examples/hash";
import bankAccountToml from "@/examples/miden-bank/bank-account/miden-project.toml";
import bankAccountRust from "@/examples/miden-bank/bank-account/src/lib.rs";
import midenBankCompiled from "@/examples/miden-bank/compiled.json";
import depositNoteToml from "@/examples/miden-bank/deposit-note/miden-project.toml";
import depositNoteRust from "@/examples/miden-bank/deposit-note/src/lib.rs";
import initTxScriptToml from "@/examples/miden-bank/init-tx-script/miden-project.toml";
import initTxScriptRust from "@/examples/miden-bank/init-tx-script/src/lib.rs";
import withdrawRequestNoteToml from "@/examples/miden-bank/withdraw-request-note/miden-project.toml";
import withdrawRequestNoteRust from "@/examples/miden-bank/withdraw-request-note/src/lib.rs";
import type { Export, PackageMetadata, PackageType } from "@/lib/types";

export type CompiledExample = {
  sourcesHash: string;
  packages: Record<
    string,
    {
      type: PackageType;
      // The build's Miden Assembly, for the MASM tab.
      masm?: string;
      masp: string;
      commitment: string;
      exports: Export[];
      // The package's schemas, null when it has none.
      metadata?: PackageMetadata | null;
      dependencies: { name: string; commitment: string }[];
    }
  >;
};

export type Example = { sources: ExampleSources; compiled: CompiledExample };

// Keyed by the web app's example ids (apps/web/lib/examples). Sources are
// keyed by package directory, which is what `path = "../<dir>"` dependencies
// in miden-project.toml resolve against.
export const examples: Record<string, Example> = {
  "counter-account": {
    sources: {
      "counter-account": {
        midenProjectToml: counterAccountToml,
        rust: counterAccountRust,
      },
      "increment-note": {
        midenProjectToml: incrementNoteToml,
        rust: incrementNoteRust,
      },
    },
    compiled: counterContractCompiled as unknown as CompiledExample,
  },
  "bank-account": {
    sources: {
      "bank-account": {
        midenProjectToml: bankAccountToml,
        rust: bankAccountRust,
      },
      "deposit-note": {
        midenProjectToml: depositNoteToml,
        rust: depositNoteRust,
      },
      "init-tx-script": {
        midenProjectToml: initTxScriptToml,
        rust: initTxScriptRust,
      },
      "withdraw-request-note": {
        midenProjectToml: withdrawRequestNoteToml,
        rust: withdrawRequestNoteRust,
      },
    },
    compiled: midenBankCompiled as unknown as CompiledExample,
  },
};
