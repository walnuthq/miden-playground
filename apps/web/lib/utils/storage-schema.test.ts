import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { StorageSchema } from "../types/script.ts";
import {
  mergeStorageSlots,
  schemaStorageSlots,
  storageSlotDescriptions,
} from "./storage-schema.ts";

const countMap = "counter_contract::counter_contract::count_map";
const owner = "counter_contract::counter_contract::owner";

const schema: StorageSchema = {
  slots: [
    {
      name: countMap,
      description: "counter contract storage map",
      type: "map",
      keyType: "word",
      valueType: "felt",
    },
    { name: owner, type: "value", valueType: "word" },
  ],
};

describe("schemaStorageSlots", () => {
  test("lists the schema's slots at their defaults", () => {
    assert.deepEqual(schemaStorageSlots(schema), [
      { name: countMap, type: "map", value: "" },
      { name: owner, type: "value", value: "0" },
    ]);
  });

  test("uses a value slot's default word", () => {
    const defaultValue = `0x${"01".padEnd(64, "0")}`;
    assert.deepEqual(
      schemaStorageSlots({
        slots: [
          { name: owner, type: "value", valueType: "word", defaultValue },
        ],
      }),
      [{ name: owner, type: "value", value: defaultValue }],
    );
  });
});

describe("mergeStorageSlots", () => {
  test("keeps the edits of the slots the schema still has", () => {
    assert.deepEqual(
      mergeStorageSlots(schema, [
        { name: owner, type: "value", value: "7" },
        { name: countMap, type: "map", value: "1:2" },
      ]),
      [
        { name: countMap, type: "map", value: "1:2" },
        { name: owner, type: "value", value: "7" },
      ],
    );
  });

  test("drops removed slots and adds new ones at their defaults", () => {
    assert.deepEqual(
      mergeStorageSlots(schema, [
        { name: owner, type: "value", value: "7" },
        { name: "gone::slot", type: "value", value: "3" },
      ]),
      [
        { name: countMap, type: "map", value: "" },
        { name: owner, type: "value", value: "7" },
      ],
    );
  });

  test("resets a slot whose type changed", () => {
    assert.deepEqual(
      mergeStorageSlots(schema, [
        { name: countMap, type: "value", value: "5" },
      ]),
      schemaStorageSlots(schema),
    );
  });

  test("is the defaults with nothing edited", () => {
    assert.deepEqual(mergeStorageSlots(schema, []), schemaStorageSlots(schema));
  });
});

describe("storageSlotDescriptions", () => {
  test("describes each slot and its types", () => {
    assert.deepEqual(storageSlotDescriptions(schema), {
      [countMap]: "counter contract storage map (word → felt)",
      [owner]: "word",
    });
  });
});
