// The examples' hand-written schemas, by example id then package name: a MASM
// package carries no schema (decision 3 of spec/remove-rust.md). On their own,
// without the bundled `.masm` sources, so plain node scripts
// (scripts/check-templates.ts) can check that a launched example keeps them.
// Relative imports only.
import { templateSchemas } from "../lib/template-schemas.ts";
import type { TemplateSchema } from "../lib/types.ts";
import type { exampleIds } from "./ids.ts";

export const exampleSchemas: Record<
  (typeof exampleIds)[number],
  Record<string, TemplateSchema>
> = {
  "counter-account": {
    // The template's: the example's account declares the same slot.
    "counter-account": templateSchemas["counter-account"] ?? {},
  },
  "bank-account": {
    "bank-account": {
      storage: {
        slots: [
          {
            name: "bank_account::initialized",
            description:
              "1 once the bank is initialized (init-tx-script), which enables deposits; 0 before.",
            type: "value",
            valueType: "felt",
          },
          {
            name: "bank_account::balances",
            description:
              "Each depositor's balance of each asset, in its base units, under the key [depositor id suffix, depositor id prefix, asset id's faucet suffix and metadata, faucet id prefix].",
            type: "map",
            keyType: "word",
            valueType: "felt",
          },
        ],
      },
    },
    // The order of the fields is the order the script reads the note's
    // storage in.
    "withdraw-request-note": {
      noteStorage: {
        name: "withdraw-request-note",
        fields: [
          {
            name: "faucet-id",
            type: "account-id",
            width: 2,
            description: "The faucet of the asset to withdraw.",
          },
          {
            name: "amount",
            type: "asset-amount",
            width: 1,
            description:
              "The amount to withdraw, in the asset's base units: at most your balance.",
          },
        ],
      },
    },
  },
};
