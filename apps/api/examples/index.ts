// The examples launched from the web app's home page. Each is a few MASM
// packages, one directory per package under examples/<dir>, compiled through
// api-compile when the example is launched: a MASM build takes milliseconds,
// so no snapshot is kept. The sources are bundled as strings by the Text rule
// in wrangler.jsonc.
//
// Miden Bank is hidden until it's rewritten in MASM (spec/remove-rust.md,
// decision 9): launching it answers 404.

import counterAccount from "@/examples/counter-contract/counter-account/counter_account.masm";
import incrementNote from "@/examples/counter-contract/increment-note/increment_note.masm";
import type { exampleIds } from "@/examples/ids";
import { templateMetadata } from "@/lib/templates";
import type { PackageMetadata, PackageType } from "@/lib/types";

export type ExamplePackage = {
  name: string;
  type: PackageType;
  masm: string;
  // The packages of the same example it depends on, by name: each comes
  // before the packages that depend on it.
  dependencies: string[];
  // Its hand-written schemas, which it keeps while its source matches them
  // (lib/package-metadata.ts).
  metadata: PackageMetadata | null;
};

export type Example = { packages: ExamplePackage[] };

// Keyed by the web app's example ids (apps/web/lib/examples), listed in
// examples/ids.ts.
export const examples: Record<(typeof exampleIds)[number], Example> = {
  "counter-account": {
    packages: [
      {
        name: "counter-account",
        type: "account-component",
        masm: counterAccount,
        dependencies: [],
        // The template's: the example's account declares the same slot.
        metadata: templateMetadata("counter-account"),
      },
      {
        name: "increment-note",
        type: "note",
        masm: incrementNote,
        dependencies: ["counter-account"],
        // It reads no note storage.
        metadata: null,
      },
    ],
  },
};
