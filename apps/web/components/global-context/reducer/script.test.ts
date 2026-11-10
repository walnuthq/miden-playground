import assert from "node:assert/strict";
import { describe, test } from "node:test";
import reducer from "./script.ts";

type State = Parameters<typeof reducer>[0];
type Action = Parameters<typeof reducer>[1];
type Script = State["scripts"][number];
const script = (id: string, extra: object = {}) =>
  ({
    id,
    name: id,
    updatedAt: 0,
    ...extra,
  }) as unknown as Script;
const state = (scripts: Script[]) => ({ scripts }) as unknown as State;

describe("script reducer", () => {
  test("UPDATE_SCRIPT merges the payload over the script", () => {
    const a = script("a");
    const c = script("c");
    const next = reducer(state([a, script("b", { name: "old" }), c]), {
      type: "UPDATE_SCRIPT",
      payload: { script: { id: "b", name: "renamed" } },
    } as Action);
    assert.equal(next.scripts.length, 3);
    assert.equal(next.scripts[0], a);
    assert.equal(next.scripts[1]?.id, "b");
    assert.equal(next.scripts[1]?.name, "renamed");
    assert.ok((next.scripts[1]?.updatedAt ?? 0) > 0);
    assert.equal(next.scripts[2], c);
  });

  test("UPDATE_SCRIPT ignores an unknown id", () => {
    const s = state([script("a"), script("b")]);
    const next = reducer(s, {
      type: "UPDATE_SCRIPT",
      payload: { script: { id: "missing", name: "x" } },
    } as Action);
    assert.equal(next, s);
  });

  const compiled = (extra: object = {}) =>
    script("b", {
      name: "from-api",
      createdAt: 99,
      status: "compiled",
      masm: "m",
      masp: "p",
      files: { "src/lib.rs": "new", "Cargo.toml": "toml" },
      ...extra,
    });
  const compiling = () =>
    script("b", {
      name: "mine",
      createdAt: 1,
      status: "draft",
      files: { "src/lib.rs": "old" },
      dependencies: [{ id: "d1" }, { id: "d2" }],
    });
  const dependencyIds = ["d1", "d2"];

  test("SCRIPT_COMPILED applies a result for the compiled source", () => {
    const a = script("a");
    const next = reducer(state([a, compiling()]), {
      type: "SCRIPT_COMPILED",
      payload: { script: compiled(), source: "old", dependencyIds },
    } as Action);
    const b = next.scripts[1];
    assert.equal(next.scripts[0], a);
    assert.equal(b?.name, "mine");
    assert.equal(b?.createdAt, 1);
    assert.equal(b?.status, "compiled");
    assert.equal(b?.masp, "p");
    assert.equal(b?.files["src/lib.rs"], "new");
    assert.ok((b?.updatedAt ?? 0) > 0);
  });

  test("SCRIPT_COMPILED ignores a result when the source changed", () => {
    const s = state([compiling()]);
    const next = reducer(s, {
      type: "SCRIPT_COMPILED",
      payload: { script: compiled(), source: "older", dependencyIds },
    } as Action);
    assert.equal(next, s);
  });

  test("SCRIPT_COMPILED ignores a result when the dependencies changed", () => {
    const s = state([compiling()]);
    const next = reducer(s, {
      type: "SCRIPT_COMPILED",
      payload: { script: compiled(), source: "old", dependencyIds: ["d1"] },
    } as Action);
    assert.equal(next, s);
  });

  test("SCRIPT_COMPILED ignores a result for a missing script", () => {
    const s = state([script("a")]);
    const next = reducer(s, {
      type: "SCRIPT_COMPILED",
      payload: { script: compiled(), source: "old", dependencyIds },
    } as Action);
    assert.equal(next, s);
  });

  test("DELETE_SCRIPT removes an existing script", () => {
    const a = script("a");
    const c = script("c");
    const next = reducer(state([a, script("b"), c]), {
      type: "DELETE_SCRIPT",
      payload: { scriptId: "b" },
    } as Action);
    assert.equal(next.scripts.length, 2);
    assert.equal(next.scripts[0], a);
    assert.equal(next.scripts[1], c);
  });

  test("DELETE_SCRIPT ignores an unknown id", () => {
    const s = state([script("a"), script("b")]);
    const next = reducer(s, {
      type: "DELETE_SCRIPT",
      payload: { scriptId: "missing" },
    } as Action);
    assert.equal(next, s);
  });

  test("SET_READ_ONLY_PROCEDURE_RESULT sets the account, digest and result", () => {
    const next = reducer(state([]), {
      type: "SET_READ_ONLY_PROCEDURE_RESULT",
      payload: { accountId: "acc", digest: "dig", result: "42" },
    } as Action);
    assert.equal(next.readOnlyProcedureAccountId, "acc");
    assert.equal(next.readOnlyProcedureDigest, "dig");
    assert.equal(next.readOnlyProcedureResult, "42");
  });
});
