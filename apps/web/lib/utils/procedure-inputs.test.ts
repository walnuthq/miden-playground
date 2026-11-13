import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { MidenRawType, Signature } from "../types/script.ts";
import {
  decodeProcedureResult,
  encodeProcedureArguments,
  isFelt,
  isWord,
  procedureArgumentsReady,
  procedureParams,
  wordToHex,
} from "./procedure-inputs.ts";

const struct = (name: string, size = 4) => ({
  Struct: { name: `miden:base/core-types@1.0.0/${name}` as MidenRawType, size },
});

const signature = (params: string[], results: string[] = []): Signature => ({
  abi: 3,
  params: params.map((name) => struct(name)),
  results: results.map((name) => struct(name, name === "word" ? 16 : 4)),
});

const accountIdParts = () => ({ prefix: 10n, suffix: 20n });

describe("procedureParams", () => {
  test("names the parameters by position and maps the known types", () => {
    assert.deepEqual(
      procedureParams({ signature: signature(["account-id", "asset"]) }),
      [
        { name: "param_0", type: "AccountId", rawType: "account-id" },
        { name: "param_1", type: "Asset", rawType: "asset" },
      ],
    );
  });

  test("leaves a type the forms don't know without a type", () => {
    const params = procedureParams({ signature: signature(["note-idx"]) });
    assert.equal(params[0]?.type, undefined);
    assert.equal(params[0]?.rawType, "note-idx");
    assert.equal(procedureArgumentsReady(params, {}), false);
  });
});

describe("validation", () => {
  test("felts are integers below the modulus", () => {
    assert.equal(isFelt("0"), true);
    assert.equal(isFelt(" 42 "), true);
    assert.equal(isFelt("0x2a"), true);
    assert.equal(isFelt("18446744069414584320"), true);
    assert.equal(isFelt("18446744069414584321"), false);
    assert.equal(isFelt("-1"), false);
    assert.equal(isFelt(""), false);
    assert.equal(isFelt("1.5"), false);
  });

  test("words are 0x and 64 hex digits", () => {
    assert.equal(isWord(`0x${"0".repeat(64)}`), true);
    assert.equal(isWord(`0x${"0".repeat(63)}`), false);
    assert.equal(isWord("1"), false);
  });

  test("every parameter needs a valid argument", () => {
    const params = procedureParams({ signature: signature(["felt", "asset"]) });
    assert.equal(procedureArgumentsReady(params, {}), false);
    assert.equal(
      procedureArgumentsReady(params, {
        param_0: { type: "Felt", value: "1" },
        param_1: { type: "Asset", faucetId: "0xabc", amount: "" },
      }),
      false,
    );
    assert.equal(
      procedureArgumentsReady(params, {
        param_0: { type: "Felt", value: "1" },
        param_1: { type: "Asset", faucetId: "0xabc", amount: "5" },
      }),
      true,
    );
  });
});

describe("encodeProcedureArguments", () => {
  test("encodes as the account page's Invoke dialog does", () => {
    const params = procedureParams({
      signature: signature(["felt", "account-id", "asset"]),
    });
    assert.deepEqual(
      encodeProcedureArguments({
        params,
        args: {
          param_0: { type: "Felt", value: " 7 " },
          param_1: { type: "AccountId", accountId: "0x01" },
          param_2: { type: "Asset", faucetId: "0x02", amount: "100" },
        },
        accountIdParts,
      }),
      [
        { name: "param_0", type: "Felt", value: "7" },
        {
          name: "param_1",
          type: "AccountId",
          value: JSON.stringify({ prefix: "10", suffix: "20" }),
        },
        {
          name: "param_2",
          type: "Asset",
          value: JSON.stringify({ prefix: "10", suffix: "21", amount: "100" }),
        },
      ],
    );
  });

  test("refuses a missing argument", () => {
    assert.throws(() =>
      encodeProcedureArguments({
        params: procedureParams({ signature: signature(["felt"]) }),
        args: {},
        accountIdParts,
      }),
    );
  });
});

describe("decodeProcedureResult", () => {
  test("a felt in decimal", () => {
    assert.equal(
      decodeProcedureResult(signature([], ["felt"]), [5n, 0n, 0n, 0n]),
      "5",
    );
  });

  test("a word in hex, as Word.toHex() prints it", () => {
    const hex = `0x0100000000000000${"0".repeat(48)}`;
    assert.equal(wordToHex([1n, 0n, 0n, 0n]), hex);
    assert.equal(
      decodeProcedureResult(signature([], ["word"]), [1n, 0n, 0n, 0n]),
      hex,
    );
    // Older manifests: four felt results.
    assert.equal(
      decodeProcedureResult(signature([], ["felt", "felt", "felt", "felt"]), [
        1n,
        0n,
        0n,
        0n,
      ]),
      hex,
    );
  });

  test("nothing when the procedure returns nothing", () => {
    assert.equal(decodeProcedureResult(signature([]), [1n]), "");
  });
});
