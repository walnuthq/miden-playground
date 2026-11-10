import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { toPackageType } from "./package-type.ts";

describe("toPackageType", () => {
  for (const [input, expected] of [
    ["lib", "library"],
    ["account", "account-component"],
    ["tx-script", "transaction-script"],
    ["transaction-script", "transaction-script"],
    ["note", "note"],
    [undefined, undefined],
    ["", undefined],
    ["nope", undefined],
  ] as const) {
    test(`${JSON.stringify(input)} -> ${JSON.stringify(expected)}`, () => {
      assert.equal(toPackageType(input), expected);
    });
  }
});
