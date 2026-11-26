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

// The exports api-compile builds for plan 02's templates and for a probe
// that takes a parameter of each kind (fixtures/masm-manifests.json).
const manifests = JSON.parse(
  readFileSync(
    new URL("./fixtures/masm-manifests.json", import.meta.url),
    "utf8",
  ),
) as {
  templates: Record<string, ProcedureExport[]>;
  "probe-types": { exports: ProcedureExport[] };
};

const exported = (
  procedureExports: ProcedureExport[] | undefined,
  name: string,
) => {
  const procedureExport = procedureExports?.find(({ path }) =>
    path.endsWith(`::${name}`),
  );
  assert.ok(procedureExport, name);
  return procedureExport;
};

const template = (script: string, procedure: string) =>
  exported(manifests.templates[script], procedure);

const probe = exported(manifests["probe-types"].exports, "probe");

const param = (procedureExport: ProcedureExport, index: number) => {
  const layout = procedureExport.signature.params[index];
  assert.ok(layout);
  return layout;
};

const accountId = param(template("count-reader", "copy_count"), 0);
const asset = param(template("basic-wallet", "receive_asset"), 0);
const word = param(template("basic-wallet", "create_note"), 2);
const pair = param(probe, 3);

const signature = (
  params: MidenTypeLayout[],
  results: MidenTypeLayout[] = [],
): Signature => ({ abi: 3, params, results });

const accountIdParts = () => ({ prefix: 10n, suffix: 20n });

describe("feltCount", () => {
  test("counts a layout's felts", () => {
    assert.equal(feltCount("Felt"), 1);
    assert.equal(feltCount(word), 4);
    assert.equal(feltCount(accountId), 2);
    assert.equal(feltCount(asset), 8);
    assert.equal(feltCount("U64"), 2);
    assert.equal(feltCount(param(probe, 4)), 3);
  });

  test("lists them by field path, in field order", () => {
    assert.deepEqual(feltLeaves(accountId), ["suffix", "prefix"]);
    assert.deepEqual(feltLeaves(word), ["0", "1", "2", "3"]);
    assert.deepEqual(feltLeaves(pair), ["first", "second"]);
    // A `u64`'s low limb first, as miden-core-lib takes it.
    assert.deepEqual(feltLeaves(param(probe, 4)), [
      "amount.lo",
      "amount.hi",
      "flag",
    ]);
  });

  test("nothing without a layout, or with a leaf that isn't a felt", () => {
    // A hand-written signature with the name alone.
    assert.equal(feltCount({ Struct: { name: "Pair" } }), undefined);
    // An enum whose variants carry values.
    assert.equal(
      feltCount({
        Enum: {
          name: "Option",
          discriminant: "U8",
          variants: [
            { name: "None", discriminant_value: 0, value: null },
            { name: "Some", discriminant_value: 1, value: "Felt" },
          ],
        },
      }),
      undefined,
    );
  });
});

describe("procedureParams", () => {
  test("the four known types, named from the source", () => {
    assert.deepEqual(procedureParams(template("count-reader", "copy_count")), [
      { name: "counter_account_id", type: "AccountId", rawType: "AccountId" },
    ]);
    assert.deepEqual(
      procedureParams(template("basic-wallet", "receive_asset")),
      [{ name: "asset", type: "Asset", rawType: "Asset" }],
    );
    assert.deepEqual(
      procedureParams({ signature: signature(["Felt", word]) }),
      [
        { name: "param_0", type: "Felt", rawType: "felt" },
        { name: "param_1", type: "Word", rawType: "word" },
      ],
    );
  });

  test("an integer below a felt, a bool and an enum are bounded felts", () => {
    assert.deepEqual(procedureParams(template("basic-wallet", "create_note")), [
      {
        name: "tag",
        type: "Felt",
        rawType: "NoteTag",
        label: "NoteTag (u32)",
        max: 2n ** 32n - 1n,
      },
      {
        name: "note_type",
        type: "Felt",
        rawType: "NoteType",
        label: "NoteType (0 PRIVATE, 1 PUBLIC)",
        max: 1n,
      },
      { name: "recipient", type: "Word", rawType: "NoteRecipient" },
    ]);
    assert.deepEqual(
      procedureParams(template("basic-wallet", "move_asset_to_note"))[1],
      {
        name: "note_idx",
        type: "Felt",
        rawType: "u16",
        label: "u16",
        max: 65535n,
      },
    );
    const [small, , flag] = procedureParams(probe);
    assert.deepEqual(small, {
      name: "small",
      type: "Felt",
      rawType: "u8",
      label: "u8",
      max: 255n,
    });
    assert.deepEqual(flag, {
      name: "flag",
      type: "Felt",
      rawType: "i1",
      label: "i1 (0 or 1)",
      max: 1n,
    });
  });

  test("a type the forms don't know gets its layout's felts", () => {
    const [, wide, , pairParam, mixed] = procedureParams(probe);
    assert.deepEqual(wide, {
      name: "wide",
      rawType: "u64",
      feltCount: 2,
      feltNames: ["lo", "hi"],
    });
    assert.deepEqual(pairParam, {
      name: "pair",
      rawType: "Pair",
      feltCount: 2,
      feltNames: ["first", "second"],
    });
    assert.deepEqual(mixed?.feltNames, ["amount.lo", "amount.hi", "flag"]);
  });

  test("a parameter without a layout can't be entered", () => {
    const params = procedureParams({
      signature: signature([{ Struct: { name: "Pair" } }]),
    });
    assert.deepEqual(params, [{ name: "param_0", rawType: "Pair" }]);
    assert.equal(procedureArgumentsReady(params, {}), false);
  });

  const parameters = [
    { name: "counter_account_id", type: "AccountId" },
    { name: "amount", type: "felt" },
  ];

  test("falls back to positions for every parameter", () => {
    const fallback = (
      parameters?: { name: string; type: string }[],
    ): string[] =>
      procedureParams({
        signature: signature([accountId, "Felt"]),
        parameters,
      }).map(({ name }) => name);
    assert.deepEqual(fallback(parameters), ["counter_account_id", "amount"]);
    // Missing: a package compiled before api-compile reported them.
    assert.deepEqual(fallback(undefined), ["param_0", "param_1"]);
    // Not as many names as the signature has parameters.
    assert.deepEqual(fallback(parameters.slice(0, 1)), ["param_0", "param_1"]);
    // An empty name, or two that are the same.
    assert.deepEqual(
      fallback([
        parameters[0] as (typeof parameters)[number],
        { name: "", type: "felt" },
      ]),
      ["param_0", "param_1"],
    );
    assert.deepEqual(
      fallback([
        { name: "an_id", type: "AccountId" },
        { name: "an_id", type: "felt" },
      ]),
      ["param_0", "param_1"],
    );
    // A procedure without parameters has an empty list.
    assert.equal(
      procedureParameterNames(template("counter-account", "get_count"))?.length,
      0,
    );
  });

  test("without names, a type is the manifest's", () => {
    assert.deepEqual(
      procedureParams({
        signature: template("basic-wallet", "create_note").signature,
      }).map(({ name, rawType, label }) => `${name}: ${label ?? rawType}`),
      [
        "param_0: u32",
        "param_1: NoteType (0 PRIVATE, 1 PUBLIC)",
        "param_2: word",
      ],
    );
  });
});

describe("procedureSignature", () => {
  test("the templates' procedures, as MASM", () => {
    assert.equal(
      procedureSignature(template("counter-account", "get_count")),
      "proc get_count() -> Felt",
    );
    assert.equal(
      procedureSignature(template("count-reader", "copy_count")),
      "proc copy_count(counter_account_id: AccountId)",
    );
    assert.equal(
      procedureSignature(template("basic-wallet", "create_note")),
      "proc create_note(tag: NoteTag, note_type: NoteType, recipient: Word) -> u16",
    );
    assert.equal(
      procedureSignature(template("p2id-note", "main")),
      "proc main()",
    );
  });

  test("the types alone without names", () => {
    assert.equal(
      procedureSignature({
        ...template("count-reader", "copy_count"),
        parameters: undefined,
      }),
      "proc copy_count(AccountId)",
    );
    assert.equal(
      procedureSignature({ ...probe, parameters: undefined }),
      "proc probe(u8, u64, i1, Pair, WithU64) -> i1",
    );
    assert.equal(
      procedureSignature(probe),
      "proc probe(small: u8, wide: u64, flag: i1, pair: Pair, mixed: WithU64) -> i1",
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
    const params = procedureParams({ signature: signature(["Felt", asset]) });
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

  test("a bounded felt stays within its type", () => {
    const params = procedureParams(template("basic-wallet", "create_note"));
    const args: ProcedureArguments = {
      tag: { type: "Felt", value: "4294967295" },
      note_type: { type: "Felt", value: "1" },
      recipient: { type: "Word", value: `0x${"1".repeat(64)}` },
    };
    assert.equal(procedureArgumentsReady(params, args), true);
    assert.equal(
      procedureArgumentsReady(params, {
        ...args,
        note_type: { type: "Felt", value: "2" },
      }),
      false,
    );
    assert.equal(
      procedureArgumentError(
        { type: "Felt", value: "0x100000000" },
        2n ** 32n - 1n,
      ),
      "At most 4294967295.",
    );
    assert.equal(
      procedureArgumentError({ type: "Felt", value: "2" }),
      undefined,
    );
  });

  test("raw felts: as many as the layout's, each a felt", () => {
    const params = procedureParams({ signature: signature([pair]) });
    assert.equal(
      procedureArgumentsReady(params, {
        param_0: { type: "Felts", values: ["1", "0x2"] },
      }),
      true,
    );
    assert.equal(procedureArgumentsReady(params, {}), false);
    for (const values of [["1", "x"], ["1", ""], ["1"]]) {
      assert.equal(
        procedureArgumentsReady(params, {
          param_0: { type: "Felts", values },
        }),
        false,
      );
    }
    // A typed argument for an untyped parameter.
    assert.equal(
      procedureArgumentsReady(params, {
        param_0: { type: "Felt", value: "1" },
      }),
      false,
    );
    assert.equal(
      procedureArgumentError({ type: "Felts", values: ["1", "-1"] }),
      "Not a field element.",
    );
  });

  test("a call passes at most 16 felts", () => {
    const felts: ProcedureArgument = {
      type: "Felts",
      values: ["1", "2", "3", "4", "5", "6"],
    };
    const triple: MidenTypeLayout = {
      Struct: {
        name: "Triple",
        fields: ["a", "b", "c", "d", "e", "f"].map((name) => ({
          name,
          ty: "Felt",
        })),
      },
    };
    const params = (count: number) =>
      procedureParams({
        signature: signature(Array.from({ length: count }, () => triple)),
      });
    const args = (count: number) =>
      Object.fromEntries(
        Array.from({ length: count }, (_, index) => [`param_${index}`, felts]),
      );
    assert.equal(procedureArgumentFelts(params(2)), 12);
    assert.equal(procedureArgumentsReady(params(2), args(2)), true);
    assert.equal(procedureArgumentFelts(params(3)), 18);
    assert.equal(procedureArgumentsReady(params(3), args(3)), false);
    // The typed arguments count too: a felt, a word, an account id, an asset,
    // and a bounded felt.
    assert.equal(
      procedureArgumentFelts(
        procedureParams({
          signature: signature(["Felt", word, accountId, asset, "U16"]),
        }),
      ),
      16,
    );
  });
});

describe("raw felts", () => {
  test("are encoded in decimal, in field order", () => {
    assert.deepEqual(
      encodeProcedureArguments({
        params: procedureParams({
          ...probe,
          signature: signature([pair]),
          parameters: undefined,
        }),
        args: { param_0: { type: "Felts", values: [" 0x10 ", "2"] } },
        accountIdParts,
      }),
      [{ name: "param_0", type: "Felts", value: '["16","2"]' }],
    );
    assert.throws(() =>
      encodeProcedureArguments({
        params: procedureParams({ signature: signature([pair]) }),
        args: { param_0: { type: "Felt", value: "16" } },
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
        params: procedureParams({ signature: signature([accountId]) }),
        args: { param_0: { type: "AccountId", accountId: "0x01" } },
        accountIdParts,
      }),
    );
    // A struct laid out as an account id: suffix, then prefix.
    const raw = formatProcedureInputs(
      encodeProcedureArguments({
        params: procedureParams({
          signature: signature([
            {
              Struct: {
                ...(accountId as { Struct: object }).Struct,
                name: "Id",
              },
            } as MidenTypeLayout,
          ]),
        }),
        // `accountIdParts` above: the suffix, then the prefix.
        args: { param_0: { type: "Felts", values: ["20", "10"] } },
        accountIdParts,
      }),
    );
    // The suffix on top: `[counter_account_id_suffix,
    // counter_account_id_prefix, …]`, as count-reader takes it.
    assert.equal(typed, "push.10.20");
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

  test("a bounded felt pushes as a felt", () => {
    const params = procedureParams(
      template("basic-wallet", "move_asset_to_note"),
    );
    assert.equal(
      formatProcedureInputs(
        encodeProcedureArguments({
          params,
          args: {
            asset: { type: "Asset", faucetId: "0x02", amount: "100" },
            note_idx: { type: "Felt", value: "3" },
          },
          accountIdParts,
        }),
      ).split("\n")[0],
      "push.3",
    );
  });
});

describe("encodeProcedureArguments", () => {
  test("encodes as the account page's Invoke dialog does", () => {
    const params = procedureParams({
      signature: signature(["Felt", accountId, asset]),
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
        params: procedureParams({ signature: signature(["Felt"]) }),
        args: {},
        accountIdParts,
      }),
    );
  });
});

describe("decodeProcedureResult", () => {
  test("a felt in decimal", () => {
    assert.equal(
      decodeProcedureResult(
        template("counter-account", "get_count").signature,
        [5n, 0n, 0n, 0n],
      ),
      "5",
    );
  });

  test("an integer below a felt in decimal", () => {
    assert.equal(
      decodeProcedureResult(template("basic-wallet", "create_note").signature, [
        2n,
        0n,
      ]),
      "2",
    );
    assert.equal(decodeProcedureResult(probe.signature, [1n, 0n]), "1");
  });

  test("a word in hex, as Word.toHex() prints it", () => {
    const hex = `0x0100000000000000${"0".repeat(48)}`;
    assert.equal(wordToHex([1n, 0n, 0n, 0n]), hex);
    assert.equal(
      decodeProcedureResult(signature([], [word]), [1n, 0n, 0n, 0n]),
      hex,
    );
  });

  test("another type as its felts", () => {
    assert.equal(
      decodeProcedureResult(
        exported(manifests["probe-types"].exports, "pair").signature,
        [1n, 2n, 0n],
      ),
      "[1, 2]",
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
