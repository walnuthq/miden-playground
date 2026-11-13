import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { StorageSlot } from "../types/component.ts";
import {
  applyStorageChanges,
  effectiveStorageChanges,
  storageSlotError,
  storageSlotsValid,
  wordFelts,
  wordHexToText,
  wordTextToHex,
} from "./storage-slots.ts";

const hex = (first: string, rest = "0".repeat(48)) => `0x${first}${rest}`;
const ONE = hex("0100000000000000");
const FIVE = hex("0500000000000000");
const SIX = hex("0600000000000000");
const FULL = `0x${"0100000000000000"}${"0200000000000000"}${"0300000000000000"}${"0400000000000000"}`;

const countMap: StorageSlot = {
  name: "c::count_map",
  type: "map",
  value: "1:5",
};
const owner: StorageSlot = { name: "c::owner", type: "value", value: "7" };

describe("words as text", () => {
  test("a felt fills the first element", () => {
    assert.deepEqual(wordFelts("5"), [5n, 0n, 0n, 0n]);
    assert.deepEqual(wordFelts(""), [0n, 0n, 0n, 0n]);
    assert.equal(wordTextToHex("5"), FIVE);
  });

  test("a hex word round-trips", () => {
    assert.deepEqual(wordFelts(FULL), [1n, 2n, 3n, 4n]);
    assert.equal(wordTextToHex(FULL), FULL);
    assert.equal(wordHexToText(FULL), FULL);
    assert.equal(wordHexToText(FIVE), "5");
  });
});

describe("validation", () => {
  test("names, values and map entries", () => {
    assert.equal(storageSlotError(owner), undefined);
    assert.equal(storageSlotError(countMap), undefined);
    assert.equal(storageSlotError({ ...countMap, value: "" }), undefined);
    assert.ok(storageSlotError({ ...owner, name: " " }));
    assert.ok(storageSlotError({ ...owner, value: "x" }));
    assert.ok(storageSlotError({ ...countMap, value: "1:" }));
    assert.ok(storageSlotError({ ...countMap, value: `1:5,${ONE}:6` }));
  });

  test("slot names are unique", () => {
    assert.equal(storageSlotsValid([owner, countMap]), true);
    assert.equal(storageSlotsValid([owner, owner]), false);
  });
});

describe("applyStorageChanges", () => {
  test("updates a map entry in place and adds new ones", () => {
    assert.deepEqual(
      applyStorageChanges([owner, countMap], {
        values: [],
        entries: [
          { name: "c::count_map", key: ONE, value: SIX },
          { name: "c::count_map", key: FULL, value: FIVE },
        ],
      }),
      [owner, { ...countMap, value: `1:6,${FULL}:5` }],
    );
  });

  test("updates a value slot and ignores other components' slots", () => {
    assert.deepEqual(
      applyStorageChanges([owner, countMap], {
        values: [
          { name: "c::owner", value: FULL },
          { name: "other::slot", value: ONE },
        ],
        entries: [],
      }),
      [{ ...owner, value: FULL }, countMap],
    );
  });
});

describe("effectiveStorageChanges", () => {
  test("drops the slots a new account reports unchanged", () => {
    const SEVEN = hex("0700000000000000");
    assert.deepEqual(
      effectiveStorageChanges(
        [
          { name: "c::owner", type: "value", item: SEVEN, mapEntries: [] },
          {
            name: "c::count_map",
            type: "map",
            item: SEVEN,
            mapEntries: [{ key: ONE, value: FIVE }],
          },
          { name: "other::kept", type: "value", item: ONE, mapEntries: [] },
        ],
        {
          values: [
            { name: "c::owner", value: SEVEN },
            { name: "other::kept", value: ONE },
            { name: "other::set", value: ONE },
          ],
          entries: [
            { name: "c::count_map", key: ONE, value: FIVE },
            { name: "c::count_map", key: FULL, value: SIX },
          ],
        },
      ),
      {
        values: [{ name: "other::set", value: ONE }],
        entries: [{ name: "c::count_map", key: FULL, value: SIX }],
      },
    );
  });
});
