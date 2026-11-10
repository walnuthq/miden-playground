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
});
