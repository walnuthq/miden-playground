import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { kebabCase } from "./case.ts";

describe("kebabCase", () => {
  for (const [input, expected] of [
    ["P2IDNote", "p-2-id-note"],
    ["CounterContract", "counter-contract"],
    ["the2ndTry", "the-2nd-try"],
    ["counter_account", "counter-account"],
  ] as const) {
    test(`${input} -> ${expected}`, () => {
      assert.equal(kebabCase(input), expected);
    });
  }
});
