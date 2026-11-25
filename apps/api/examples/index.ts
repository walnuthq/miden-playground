// The examples launched from the web app's home page. Their sources are
// MASM projects, one directory per package, and compiled.json holds their
// initial compile output (regenerate it with `pnpm examples:compile`, see
// scripts/compile-examples.ts), so launching an example needs no
// api-compile round trip. The sources are bundled as strings by the Text
// rule in wrangler.jsonc.
//
// None for now: Miden Bank is retired, and the Counter Contract example is
// still the Rust project in examples/counter-contract, unreachable until it
// is rewritten in MASM (plan 06 of spec/remove-rust). Launching either
// answers 404.

import type { ExampleSources } from "@/examples/hash";
import type { Export, PackageMetadata, PackageType } from "@/lib/types";

export type CompiledExample = {
  sourcesHash: string;
  packages: Record<
    string,
    {
      type: PackageType;
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
export const examples: Record<string, Example> = {};
