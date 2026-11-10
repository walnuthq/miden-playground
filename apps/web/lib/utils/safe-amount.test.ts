import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { toSafeNumber } from "./safe-amount.ts";

describe("toSafeNumber", () => {
  test("converts zero", () => {
    assert.equal(toSafeNumber(0n), 0);
  });

  test("converts the largest safe integer", () => {
    assert.equal(toSafeNumber(9007199254740991n), 9007199254740991);
  });

  test("refuses amounts a number would round", () => {
    assert.throws(() => toSafeNumber(9007199254740992n), /too large/);
  });
});
