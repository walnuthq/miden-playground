import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import type {
  MidenTypeLayout,
  ProcedureExport,
  Signature,
} from "../types/script.ts";
import {
  cleanExecutionError,
  decodeProcedureResult,
  encodeProcedureArguments,
  feltCount,
  feltLeaves,
  formatProcedureInputs,
  isFelt,
  isWord,
  type ProcedureArgument,
  type ProcedureArguments,
  procedureArgumentError,
  procedureArgumentFelts,
  procedureArgumentsReady,
  procedureParameterNames,
  procedureParams,
  procedureSignature,
  withAccountIdsAmong,
  wordToHex,
} from "./procedure-inputs.ts";

const struct = (name: string, size = 4) => ({
  Struct: { name: `miden:base/core-types@1.0.0/${name}`, size },
});

// The embedded basic wallet's exports, whose parameters carry the layouts
// midenc writes: `move-asset-to-note(asset, note-idx)` and
// `create-note(tag, note-type, recipient)`, a `recipient` laid out as an
// `asset-id` (a word).
const wallet = (
  JSON.parse(
    readFileSync(
      new URL("../tutorials/basic-wallet.json", import.meta.url),
      "utf8",
    ),
  ) as { exports: { Procedure: ProcedureExport }[] }
).exports.map(({ Procedure }) => Procedure);

const walletExport = (name: string) => {
  const procedureExport = wallet.find(({ path }) => path.endsWith(`"${name}"`));
  assert.ok(procedureExport);
  return procedureExport;
};

const layout = (procedure: string, index: number) => {
  const param = walletExport(procedure).signature.params[index];
  assert.ok(param);
  return param;
};

const noteIdx = layout("move-asset-to-note", 1);
const assetId = layout("create-note", 2);
const accountId: MidenTypeLayout = {
  Struct: {
    name: "miden:base/core-types@1.0.0/account-id",
    size: 8,
    fields: [
      { name: "prefix", ty: struct("felt") },
      { name: "suffix", ty: struct("felt") },
    ].map(({ name, ty }) => ({
      name,
      ty: { Struct: { ...ty.Struct, fields: [{ name: "inner", ty: "Felt" }] } },
    })),
  },
};

// A record a package defines, laid out as an account id: two felts.
const pair: MidenTypeLayout = {
  Struct: { ...accountId.Struct, name: "pair" },
};

const signature = (params: string[], results: string[] = []): Signature => ({
  abi: 3,
  params: params.map((name) => struct(name)),
  results: results.map((name) => struct(name, name === "word" ? 16 : 4)),
});

const accountIdParts = () => ({ prefix: 10n, suffix: 20n });

describe("feltCount", () => {
  test("counts a layout's felts", () => {
    assert.equal(feltCount(noteIdx), 1);
    assert.equal(feltCount(assetId), 4);
    assert.equal(feltCount(layout("move-asset-to-note", 0)), 8);
    assert.equal(feltCount("Felt"), 1);
  });

  test("lists them by field path, in field order", () => {
    assert.deepEqual(feltLeaves(noteIdx), ["inner.inner"]);
    assert.deepEqual(feltLeaves(assetId), [
      "inner.a.inner",
      "inner.b.inner",
      "inner.c.inner",
      "inner.d.inner",
    ]);
    assert.deepEqual(feltLeaves(pair), ["prefix.inner", "suffix.inner"]);
  });

  test("nothing without a layout, or with a leaf that isn't a felt", () => {
    assert.equal(feltCount(struct("note-idx")), undefined);
    assert.equal(feltCount("U64"), undefined);
    assert.equal(
      feltCount({
        Struct: {
          name: "mixed",
          fields: [
            { name: "first", ty: "Felt" },
            { name: "flag", ty: "I1" },
          ],
        },
      }),
      undefined,
    );
    // An option.
    assert.equal(
      feltCount({ Enum: { name: "option0", discriminant: "U8" } }),
      undefined,
    );
  });
});

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

  const parameters = [
    { name: "depositor", type: "account-id" },
    { name: "deposit-asset", type: "asset" },
  ];

  test("names the parameters from the WIT, in snake case", () => {
    assert.deepEqual(
      procedureParams({
        signature: signature(["account-id", "asset"]),
        parameters,
      }).map(({ name }) => name),
      ["depositor", "deposit_asset"],
    );
  });

  test("falls back to positions for every parameter", () => {
    const fallback = (
      parameters?: { name: string; type: string }[],
    ): string[] =>
      procedureParams({
        signature: signature(["account-id", "asset"]),
        parameters,
      }).map(({ name }) => name);
    // Missing: an older compile, a built-in, a transaction script.
    assert.deepEqual(fallback(undefined), ["param_0", "param_1"]);
    // Not as many names as the signature has parameters.
    assert.deepEqual(fallback(parameters.slice(0, 1)), ["param_0", "param_1"]);
    // An empty name, or two that are the same once in snake case.
    assert.deepEqual(
      fallback([
        parameters[0] as (typeof parameters)[number],
        { name: "", type: "asset" },
      ]),
      ["param_0", "param_1"],
    );
    assert.deepEqual(
      fallback([
        { name: "an-id", type: "account-id" },
        { name: "an_id", type: "asset" },
      ]),
      ["param_0", "param_1"],
    );
    assert.equal(
      procedureParameterNames({ signature: signature([]), parameters: [] })
        ?.length,
      0,
    );
  });

  test("leaves a type the forms don't know without a type", () => {
    const params = procedureParams({ signature: signature(["note-idx"]) });
    assert.equal(params[0]?.type, undefined);
    assert.equal(params[0]?.rawType, "note-idx");
    assert.equal(params[0]?.feltCount, undefined);
    assert.equal(procedureArgumentsReady(params, {}), false);
  });

  test("an unknown type with a layout of felts gets its felts", () => {
    assert.deepEqual(procedureParams(walletExport("move-asset-to-note")), [
      { name: "asset", type: "Asset", rawType: "asset" },
      {
        name: "note_idx",
        type: undefined,
        rawType: "note-idx",
        feltCount: 1,
        feltNames: ["felt 1"],
      },
    ]);
  });

  test("names an unknown type from the WIT, its felts from the layout", () => {
    // The manifest calls a `tag` and a `note-type` `note-idx`, a `recipient`
    // `asset-id`.
    assert.deepEqual(
      procedureParams(walletExport("create-note")).map(
        ({ rawType, feltCount, feltNames }) => ({
          rawType,
          feltCount,
          feltNames,
        }),
      ),
      [
        { rawType: "tag", feltCount: 1, feltNames: ["felt 1"] },
        { rawType: "note-type", feltCount: 1, feltNames: ["felt 1"] },
        { rawType: "recipient", feltCount: 4, feltNames: ["a", "b", "c", "d"] },
      ],
    );
    // Without names, the manifest's.
    assert.deepEqual(
      procedureParams({
        signature: walletExport("create-note").signature,
      }).map(({ name, rawType }) => `${name}: ${rawType}`),
      ["param_0: note-idx", "param_1: note-idx", "param_2: asset-id"],
    );
  });

  test("a parameter that isn't a struct has no type and no felts", () => {
    assert.deepEqual(
      procedureParams({
        signature: {
          abi: 3,
          params: ["U64", { Enum: { name: "option0" } }],
          results: [],
        },
      }),
      [
        { name: "param_0", type: undefined, rawType: "u64" },
        { name: "param_1", type: undefined, rawType: "option0" },
      ],
    );
  });
});

const deposit = (
  parameters?: ProcedureExport["parameters"],
): ProcedureExport => ({
  path: '::"miden:bank-account/bank@0.1.0"::deposit',
  digest: "0x00",
  signature: {
    abi: 3,
    params: [struct("account-id"), struct("asset")],
    results: [struct("felt")],
  },
  attributes: { attrs: [] },
  ...(parameters && { parameters }),
});

describe("procedureSignature", () => {
  test("names the parameters when the procedure has names", () => {
    assert.equal(
      procedureSignature(
        deposit([
          { name: "depositor", type: "account-id" },
          { name: "deposit-asset", type: "asset" },
        ]),
      ),
      "fn deposit(depositor: AccountId, deposit_asset: Asset) -> Felt",
    );
  });

  test("shows the types alone without names", () => {
    assert.equal(
      procedureSignature(deposit()),
      "fn deposit(AccountId, Asset) -> Felt",
    );
    // Not as many names as parameters: none of them.
    assert.equal(
      procedureSignature(deposit([{ name: "depositor", type: "account-id" }])),
      "fn deposit(AccountId, Asset) -> Felt",
    );
  });

  test("shows a type the forms don't know by its WIT name", () => {
    assert.equal(
      procedureSignature({
        ...deposit([{ name: "note-index", type: "note-idx" }]),
        signature: {
          abi: 3,
          params: [struct("note-idx")],
          results: [],
        },
      }),
      "fn deposit(note_index: note-idx)",
    );
    assert.equal(
      procedureSignature(walletExport("create-note")),
      "fn create_note(tag: tag, note_type: note-type, recipient: recipient) -> note-idx",
    );
    assert.equal(
      procedureSignature({
        ...deposit(),
        signature: { abi: 3, params: ["U64", "I1"], results: ["U32"] },
      }),
      "fn deposit(u64, i1) -> u32",
    );
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

  test("raw felts: as many as the layout's, each a felt", () => {
    const params = procedureParams(walletExport("create-note"));
    const args: ProcedureArguments = {
      tag: { type: "Felts", values: ["1"] },
      note_type: { type: "Felts", values: ["0x2"] },
      recipient: { type: "Felts", values: ["1", "2", "3", "4"] },
    };
    assert.equal(procedureArgumentsReady(params, args), true);
    assert.equal(procedureArgumentsReady(params, {}), false);
    assert.equal(
      procedureArgumentsReady(params, {
        ...args,
        recipient: { type: "Felts", values: ["1", "2", "3", "x"] },
      }),
      false,
    );
    assert.equal(
      procedureArgumentsReady(params, {
        ...args,
        recipient: { type: "Felts", values: ["1", "2", "3", ""] },
      }),
      false,
    );
    // Not the layout's count, or a typed argument for an untyped parameter.
    assert.equal(
      procedureArgumentsReady(params, {
        ...args,
        recipient: { type: "Felts", values: ["1", "2", "3"] },
      }),
      false,
    );
    assert.equal(
      procedureArgumentsReady(params, {
        ...args,
        tag: { type: "Felt", value: "1" },
      }),
      false,
    );
    assert.equal(
      procedureArgumentError({ type: "Felts", values: ["1", "-1"] }),
      "Not a field element.",
    );
  });

  test("a call passes at most 16 felts", () => {
    const word: ProcedureArgument = {
      type: "Felts",
      values: ["1", "2", "3", "4"],
    };
    const signature = (count: number): Signature => ({
      abi: 3,
      params: Array.from({ length: count }, () => assetId),
      results: [],
    });
    const args = (count: number) =>
      Object.fromEntries(
        Array.from({ length: count }, (_, index) => [`param_${index}`, word]),
      );
    const four = procedureParams({ signature: signature(4) });
    assert.equal(procedureArgumentFelts(four), 16);
    assert.equal(procedureArgumentsReady(four, args(4)), true);
    const five = procedureParams({ signature: signature(5) });
    assert.equal(procedureArgumentFelts(five), 20);
    assert.equal(procedureArgumentsReady(five, args(5)), false);
    // The typed arguments count too: a felt, a word, an account id, an asset.
    assert.equal(
      procedureArgumentFelts(
        procedureParams({
          signature: {
            abi: 3,
            params: [
              struct("felt"),
              struct("word"),
              struct("account-id"),
              struct("asset"),
            ],
            results: [],
          },
        }),
      ),
      15,
    );
    assert.equal(
      procedureArgumentFelts(
        procedureParams({
          signature: { abi: 3, params: ["U64"], results: [] },
        }),
      ),
      undefined,
    );
  });
});

describe("raw felts", () => {
  test("are encoded in decimal, in field order", () => {
    assert.deepEqual(
      encodeProcedureArguments({
        params: procedureParams(walletExport("move-asset-to-note")),
        args: {
          asset: { type: "Asset", faucetId: "0x02", amount: "100" },
          note_idx: { type: "Felts", values: [" 0x10 "] },
        },
        accountIdParts,
      }),
      [
        {
          name: "asset",
          type: "Asset",
          value: JSON.stringify({ prefix: "10", suffix: "37", amount: "100" }),
        },
        { name: "note_idx", type: "Felts", value: '["16"]' },
      ],
    );
    assert.throws(() =>
      encodeProcedureArguments({
        params: procedureParams(walletExport("move-asset-to-note")),
        args: {
          asset: { type: "Asset", faucetId: "0x02", amount: "100" },
          note_idx: { type: "Felt", value: "16" },
        },
        accountIdParts,
      }),
    );
  });

  test("are pushed last first: the first felt ends on top", () => {
    assert.equal(
      formatProcedureInputs([
        { name: "a", type: "Felts", value: '["1","2","3","4"]' },
      ]),
      "push.4.3.2.1",
    );
    // The last parameter is pushed first.
    assert.equal(
      formatProcedureInputs([
        { name: "a", type: "Felt", value: "7" },
        { name: "b", type: "Felts", value: '["1","2"]' },
        { name: "c", type: "Felts", value: '["9"]' },
      ]),
      "push.9\npush.2.1\npush.7",
    );
  });

  // The rule, from the typed arguments: a type's felts in the order of its
  // layout's fields push as the typed argument does.
  test("an account id's two felts push as the typed argument", () => {
    const typed = formatProcedureInputs(
      encodeProcedureArguments({
        params: procedureParams({
          signature: { abi: 3, params: [accountId], results: [] },
        }),
        args: { param_0: { type: "AccountId", accountId: "0x01" } },
        accountIdParts,
      }),
    );
    const params = procedureParams({
      signature: { abi: 3, params: [pair], results: [] },
    });
    assert.deepEqual(params[0]?.feltNames, ["prefix", "suffix"]);
    const raw = formatProcedureInputs(
      encodeProcedureArguments({
        params,
        // `accountIdParts` above: the prefix, then the suffix.
        args: { param_0: { type: "Felts", values: ["10", "20"] } },
        accountIdParts,
      }),
    );
    assert.equal(typed, "push.20.10");
    assert.equal(raw, typed);
  });

  test("an asset's eight felts push as the typed argument", () => {
    const typed = formatProcedureInputs([
      {
        name: "asset",
        type: "Asset",
        value: JSON.stringify({ prefix: "10", suffix: "37", amount: "100" }),
      },
    ]);
    // Its id word, then its value word.
    const raw = formatProcedureInputs([
      {
        name: "asset",
        type: "Felts",
        value: JSON.stringify(["0", "0", "37", "10", "100", "0", "0", "0"]),
      },
    ]);
    assert.equal(
      typed.replaceAll("\n", "").replaceAll("push", ""),
      ".0.0.0.100.10.37.0.0",
    );
    assert.equal(raw, "push.0.0.0.100.10.37.0.0");
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
          value: JSON.stringify({ prefix: "10", suffix: "37", amount: "100" }),
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

describe("cleanExecutionError", () => {
  test("keeps the diagnostic's message", () => {
    assert.equal(
      cleanExecutionError(
        [
          "failed to execute program: transaction execution failed: failed to execute transaction kernel program:",
          'Diagnostic { message: "assertion failed with error code: 12", labels: "[LabeledSpan { label: None }]" }',
          "NOTE: If you're looking for the fancy error reports, install miette with the `fancy` feature, or write your own and hook it up with miette::set_hook().",
          "",
        ].join("\n"),
      ),
      [
        "failed to execute program: transaction execution failed: failed to execute transaction kernel program:",
        "assertion failed with error code: 12",
      ].join("\n"),
    );
  });
});

describe("withAccountIdsAmong", () => {
  const allowed = new Set(["simulated:counter-account"]);

  test("empties an account id that isn't allowed", () => {
    const args = {
      param_0: { type: "AccountId", accountId: "0xsandbox" },
      param_1: { type: "AccountId", accountId: "simulated:counter-account" },
      param_2: { type: "Felt", value: "1" },
    } as const;
    assert.deepEqual(withAccountIdsAmong(args, allowed), {
      ...args,
      param_0: { type: "AccountId", accountId: "" },
    });
  });

  test("returns the same arguments when nothing changes", () => {
    const args = {
      param_0: { type: "AccountId", accountId: "simulated:counter-account" },
      param_1: { type: "AccountId", accountId: "" },
      param_2: { type: "Asset", faucetId: "0xsandbox", amount: "1" },
    } as const;
    assert.equal(withAccountIdsAmong(args, allowed), args);
  });
});
