import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createNoteStorageParams,
  emptyNoteStorage,
  noteStorageArgumentError,
  noteStorageFelts,
  noteStorageInputFelts,
  noteStorageInputReady,
  noteStorageParams,
  noteStorageReady,
  typedToRawNoteStorage,
} from "./note-storage.ts";

const accountIdParts = (accountId: string) =>
  accountId === "0xabc"
    ? { prefix: 11n, suffix: 22n }
    : { prefix: 0n, suffix: 0n };

describe("noteStorageParams", () => {
  test("types each field", () => {
    assert.deepEqual(
      noteStorageParams([
        { name: "target-account-id", type: "account-id", width: 2 },
        { name: "amount", type: "u64", width: 2 },
      ]),
      [
        {
          name: "target-account-id",
          type: "AccountId",
          rawType: "account-id",
          label: undefined,
        },
        { name: "amount", type: "Felt", rawType: "u64", label: "u64" },
      ],
    );
  });

  test("is nothing when a field can't be entered", () => {
    assert.equal(
      noteStorageParams([
        { name: "target", type: "account-id", width: 2 },
        { name: "price", type: "limit-price", width: 4 },
      ]),
      undefined,
    );
  });

  test("is no field for a note without storage", () => {
    assert.deepEqual(noteStorageParams([]), []);
  });
});

describe("noteStorageFelts", () => {
  test("flattens the fields in declaration order", () => {
    const params =
      noteStorageParams([
        { name: "tag", type: "felt" },
        { name: "target-account-id", type: "account-id" },
        { name: "amount", type: "u64" },
        { name: "secret", type: "word" },
        { name: "flag", type: "bool" },
      ]) ?? [];
    assert.deepEqual(
      noteStorageFelts({
        params,
        args: {
          tag: { type: "Felt", value: "42" },
          "target-account-id": { type: "AccountId", accountId: "0xabc" },
          amount: { type: "Felt", value: String(2n ** 32n + 5n) },
          secret: {
            type: "Word",
            value: `0x${"0100000000000000".repeat(2)}${"02".padEnd(16, "0")}${"00".repeat(8)}`,
          },
          flag: { type: "Felt", value: "1" },
        },
        accountIdParts,
      }),
      // The account id as its prefix then its suffix, the u64 as its low then
      // its high limb, the word as its four elements.
      ["42", "11", "22", "5", "1", "1", "1", "2", "0", "1"],
    );
  });
});

describe("noteStorageArgumentError", () => {
  const [u8, bool] =
    noteStorageParams([
      { name: "small", type: "u8" },
      { name: "flag", type: "bool" },
    ]) ?? [];

  test("bounds the one-felt integers", () => {
    assert.ok(u8 && bool);
    assert.equal(
      noteStorageArgumentError(u8, { small: { type: "Felt", value: "255" } }),
      undefined,
    );
    assert.equal(
      noteStorageArgumentError(u8, { small: { type: "Felt", value: "256" } }),
      "At most 255.",
    );
    assert.equal(
      noteStorageArgumentError(bool, { flag: { type: "Felt", value: "2" } }),
      "At most 1.",
    );
  });

  test("requires every field", () => {
    assert.ok(u8 && bool);
    assert.equal(noteStorageReady([u8, bool], {}), false);
    assert.equal(
      noteStorageReady([u8, bool], {
        small: { type: "Felt", value: "3" },
        flag: { type: "Felt", value: "0" },
      }),
      true,
    );
  });
});

const timelockFields = [
  { name: "target-account-id", type: "account-id", width: 2 },
  { name: "timelock-height", type: "felt", width: 1 },
];

const timelockParams = () => {
  const params = noteStorageParams(timelockFields);
  assert.ok(params);
  return params;
};

describe("createNoteStorageParams", () => {
  const metadata = {
    noteStorage: { name: "p2id-note", fields: timelockFields },
  };

  test("types a compiled script's schema", () => {
    assert.deepEqual(
      createNoteStorageParams({ status: "compiled", metadata })?.map(
        ({ name }) => name,
      ),
      ["target-account-id", "timelock-height"],
    );
  });

  test("is raw without a schema", () => {
    assert.equal(createNoteStorageParams({ status: "compiled" }), undefined);
    assert.equal(
      createNoteStorageParams({ status: "compiled", metadata: null }),
      undefined,
    );
    assert.equal(
      createNoteStorageParams({ status: "compiled", metadata: {} }),
      undefined,
    );
  });

  test("is raw for a field the form can't type", () => {
    assert.equal(
      createNoteStorageParams({
        status: "compiled",
        metadata: {
          noteStorage: {
            name: "n",
            fields: [{ name: "price", type: "limit-price", width: 4 }],
          },
        },
      }),
      undefined,
    );
  });

  test("is raw for a draft or a failed compile", () => {
    assert.equal(
      createNoteStorageParams({ status: "draft", metadata }),
      undefined,
    );
    assert.equal(
      createNoteStorageParams({ status: "error", metadata }),
      undefined,
    );
  });

  test("an empty schema has no field, typed", () => {
    assert.deepEqual(
      createNoteStorageParams({
        status: "compiled",
        metadata: { noteStorage: { name: "n", fields: [] } },
      }),
      [],
    );
  });
});

describe("typedToRawNoteStorage", () => {
  const params = timelockParams();

  test("the typed values' felts, prefix then suffix", () => {
    assert.deepEqual(
      typedToRawNoteStorage({
        params,
        args: {
          "target-account-id": { type: "AccountId", accountId: "0xabc" },
          "timelock-height": { type: "Felt", value: "1234" },
        },
        accountIdParts,
      }),
      ["11", "22", "1234"],
    );
  });

  test("none when a value is missing or invalid", () => {
    assert.deepEqual(
      typedToRawNoteStorage({
        params,
        args: {
          "target-account-id": { type: "AccountId", accountId: "0xabc" },
        },
        accountIdParts,
      }),
      [],
    );
    assert.deepEqual(
      typedToRawNoteStorage({
        params,
        args: {
          "target-account-id": { type: "AccountId", accountId: "0xabc" },
          "timelock-height": { type: "Felt", value: "x" },
        },
        accountIdParts,
      }),
      [],
    );
  });
});

describe("note storage input", () => {
  const params = timelockParams();
  const args = {
    "target-account-id": { type: "AccountId", accountId: "0xabc" },
    "timelock-height": { type: "Felt", value: "7" },
  } as const;

  test("starts empty, typed", () => {
    assert.deepEqual(emptyNoteStorage(), { args: {}, felts: [], raw: false });
  });

  test("typed fields are flattened, raw felts sent as entered", () => {
    assert.deepEqual(
      noteStorageInputFelts({
        params,
        input: { args, felts: ["9"], raw: false },
        accountIdParts,
      }),
      ["11", "22", "7"],
    );
    assert.deepEqual(
      noteStorageInputFelts({
        params,
        input: { args, felts: ["9"], raw: true },
        accountIdParts,
      }),
      ["9"],
    );
    assert.deepEqual(
      noteStorageInputFelts({
        params: undefined,
        input: { args, felts: ["1", "2"], raw: false },
        accountIdParts,
      }),
      ["1", "2"],
    );
  });

  test("ready when the fields shown are valid", () => {
    assert.equal(
      noteStorageInputReady(params, { args: {}, felts: [], raw: false }),
      false,
    );
    assert.equal(
      noteStorageInputReady(params, { args, felts: [], raw: false }),
      true,
    );
    assert.equal(
      noteStorageInputReady(params, { args: {}, felts: ["1"], raw: true }),
      true,
    );
    assert.equal(
      noteStorageInputReady(undefined, { args: {}, felts: [""], raw: false }),
      false,
    );
    assert.equal(
      noteStorageInputReady(undefined, { args: {}, felts: [], raw: false }),
      true,
    );
  });
});
