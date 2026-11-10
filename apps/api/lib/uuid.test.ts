import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isValidUUIDv4 } from "./uuid.ts";

const valid = "3f2b8c1e-9d4a-4f6b-8a1c-0e5d7b9c2a4f";

describe("isValidUUIDv4", () => {
  test("accepts a v4 UUID", () => {
    assert.equal(isValidUUIDv4(valid), true);
  });
  test("accepts it upper-case", () => {
    assert.equal(isValidUUIDv4(valid.toUpperCase()), true);
  });
  for (const [label, value] of [
    ["empty", ""],
    ["a slug", "basic-wallet"],
    ["version 1", "3f2b8c1e-9d4a-1f6b-8a1c-0e5d7b9c2a4f"],
    ["wrong variant", "3f2b8c1e-9d4a-4f6b-7a1c-0e5d7b9c2a4f"],
    ["trailing space", `${valid} `],
  ] as const) {
    test(`rejects ${label}`, () => {
      assert.equal(isValidUUIDv4(value), false);
    });
  }
});
