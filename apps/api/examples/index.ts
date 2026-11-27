// The examples launched from the web app's home page. Each is a few MASM
// packages, one directory per package under examples/<dir>, compiled through
// api-compile when the example is launched: a MASM build takes milliseconds,
// so no snapshot is kept. The sources are bundled as strings by the Text rule
// in wrangler.jsonc.

import counterAccount from "@/examples/counter-contract/counter-account/counter_account.masm";
import incrementNote from "@/examples/counter-contract/increment-note/increment_note.masm";
import type { ExamplePackageRef, exampleIds } from "@/examples/ids";
import bankAccount from "@/examples/miden-bank/bank-account/bank_account.masm";
import depositNote from "@/examples/miden-bank/deposit-note/deposit_note.masm";
import initTxScript from "@/examples/miden-bank/init-tx-script/init_tx_script.masm";
import withdrawRequestNote from "@/examples/miden-bank/withdraw-request-note/withdraw_request_note.masm";
import { exampleSchemas } from "@/examples/schemas";
import type { PackageMetadata, PackageType } from "@/lib/types";

export type ExamplePackage = {
  name: string;
  type: PackageType;
  masm: string;
  // The packages of the same example it depends on, by name: each comes
  // before the packages that depend on it.
  dependencies: string[];
  // Its hand-written schemas (examples/schemas.ts), which it keeps while its
  // source matches them (lib/package-metadata.ts).
  metadata: PackageMetadata | null;
};

export type Example = { packages: ExamplePackage[] };

type ExampleId = (typeof exampleIds)[number];

// A package's `metadata`: its schema from examples/schemas.ts, and for a
// note with one the package it's checked against.
const packageMetadata = (
  exampleId: ExampleId,
  name: string,
): PackageMetadata | null => {
  const schema = exampleSchemas[exampleId][name];
  if (!schema) {
    return null;
  }
  return {
    ...(schema.storage && { storage: schema.storage }),
    ...(schema.noteStorage && {
      noteStorage: schema.noteStorage,
      template: `${exampleId}/${name}` satisfies ExamplePackageRef,
    }),
  };
};

const examplePackage = (
  exampleId: ExampleId,
  name: string,
  type: PackageType,
  masm: string,
  dependencies: string[] = [],
): ExamplePackage => ({
  name,
  type,
  masm,
  dependencies,
  metadata: packageMetadata(exampleId, name),
});

// Keyed by the web app's example ids (apps/web/lib/examples), listed in
// examples/ids.ts.
export const examples: Record<ExampleId, Example> = {
  "counter-account": {
    packages: [
      examplePackage(
        "counter-account",
        "counter-account",
        "account-component",
        counterAccount,
      ),
      examplePackage(
        "counter-account",
        "increment-note",
        "note",
        incrementNote,
        ["counter-account"],
      ),
    ],
  },
  "bank-account": {
    packages: [
      examplePackage(
        "bank-account",
        "bank-account",
        "account-component",
        bankAccount,
      ),
      examplePackage(
        "bank-account",
        "init-tx-script",
        "transaction-script",
        initTxScript,
        ["bank-account"],
      ),
      examplePackage("bank-account", "deposit-note", "note", depositNote, [
        "bank-account",
      ]),
      examplePackage(
        "bank-account",
        "withdraw-request-note",
        "note",
        withdrawRequestNote,
        ["bank-account"],
      ),
    ],
  },
};

// The source of an example's package as shipped, for the stale rule of a
// note's schema (lib/package-metadata.ts).
export const examplePackageSource = (ref: ExamplePackageRef) => {
  const [exampleId, name] = ref.split("/") as [ExampleId, string];
  return examples[exampleId]?.packages.find((pkg) => pkg.name === name)?.masm;
};
