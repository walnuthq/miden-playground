import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { canSimulate } from "./can-simulate.ts";

const masp = "TUFTUA==";

describe("canSimulate", () => {
  test("offers account components, notes and transaction scripts", () => {
    for (const type of [
      "account-component",
      "note",
      "transaction-script",
    ] as const) {
      assert.equal(canSimulate({ type, masp }), true, type);
    }
  });

  test("never libraries, kernels or authentication components", () => {
    for (const type of [
      "library",
      "kernel",
      "authentication-component",
    ] as const) {
      assert.equal(canSimulate({ type, masp }), false, type);
    }
  });

  test("needs a package: not a built-in assembled from MASM", () => {
    assert.equal(canSimulate({ type: "note", masp: "" }), false);
    assert.equal(canSimulate({ type: "account-component", masp: "" }), false);
  });
});
