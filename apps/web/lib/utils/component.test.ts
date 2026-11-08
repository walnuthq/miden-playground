import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { storageSlotName } from "./component.ts";

const countMap = (packageName: string) =>
  storageSlotName({
    packageName,
    traitName: "CounterContract",
    fieldName: "count_map",
  });

// The expected names are the ones in the packages api-compile built from the
// counter template under each script name (2026-11-08, miden 0.15).
describe("storageSlotName", () => {
  test("turns the package name's dashes into underscores", () => {
    assert.equal(
      countMap("counter-account"),
      "counter_account::counter_contract::count_map",
    );
    assert.equal(
      countMap("my-counter"),
      "my_counter::counter_contract::count_map",
    );
    assert.equal(
      countMap("my-2nd-counter"),
      "my_2nd_counter::counter_contract::count_map",
    );
  });

  test("doesn't split the package name's letters from its digits", () => {
    assert.equal(countMap("counter2"), "counter2::counter_contract::count_map");
    assert.equal(
      countMap("counter-v2"),
      "counter_v2::counter_contract::count_map",
    );
    assert.equal(countMap("a1b2"), "a1b2::counter_contract::count_map");
    assert.equal(
      countMap("my-counter-2"),
      "my_counter_2::counter_contract::count_map",
    );
  });

  test("puts the trait in snake case", () => {
    // The Miden Bank example's map slot.
    assert.equal(
      storageSlotName({
        packageName: "bank-account",
        traitName: "Bank",
        fieldName: "balances",
      }),
      "bank_account::bank::balances",
    );
  });
});
