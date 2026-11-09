// The compiled `basic-wallet` package and its component: the basic wallet,
// written in Rust, that the API compiles note scripts against
// (apps/api/templates/basic-wallet.rs, the dependency of the P2ID Note
// example). A compiled note script calls the wallet's procedures by their MAST
// roots, and these aren't the standard basic wallet's (the built-in
// `basic-wallet` script, assembled from MASM, which every wallet carries): only
// an account with this component can consume a note built from the example.
// Tutorial 8 deploys its Test Wallet with it.
//
// basic-wallet.json is the package as api-compile builds it under that name
// (procedure digests depend on the package name). `pnpm templates:check` in
// apps/api compiles it again and fails once the compiler's output changes:
// `pnpm templates:sync` regenerates it (docs/claude/script-templates.md). The
// compiler's MASM isn't embedded: the MASM tab stays empty.
import compiled from "@/lib/tutorials/basic-wallet.json";
import type { Component } from "@/lib/types/component";
import type { Export, Script } from "@/lib/types/script";
import { defaultComponent } from "@/lib/utils/component";
import { compiledPackageToScript } from "@/lib/utils/script";
import { sourceFiles } from "@/lib/utils/script-files";

// Not `basic-wallet`, the built-in script's id.
const ID = "rust-basic-wallet";

export const basicWalletScript: Script = {
  ...compiledPackageToScript({
    id: ID,
    name: "basic-wallet",
    type: "account-component",
    status: "compiled",
    files: sourceFiles(compiled.source),
    masm: "",
    error: "",
    warnings: "",
    commitment: compiled.commitment,
    masp: compiled.masp,
    // The manifest's signatures are wider than the JSON's inferred type.
    exports: compiled.exports as unknown as Export[],
    dependencies: [],
  }),
  readOnly: true,
};

export const basicWalletComponent: Component = {
  ...defaultComponent(),
  id: ID,
  name: "Rust Basic Wallet",
  type: "account-component",
  scriptId: ID,
};
