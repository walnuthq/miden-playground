import assert from "node:assert/strict";
import { describe, test } from "node:test";
import reducer from "./component.ts";

type State = Parameters<typeof reducer>[0];
type Action = Parameters<typeof reducer>[1];
type Component = State["components"][number];
const component = (id: string, extra: object = {}) =>
  ({
    id,
    name: id,
    updatedAt: 0,
    ...extra,
  }) as unknown as Component;
const state = (components: Component[]) => ({ components }) as unknown as State;

describe("component reducer", () => {
  test("NEW_COMPONENT appends", () => {
    const a = component("a");
    const b = component("b");
    const next = reducer(state([a]), {
      type: "NEW_COMPONENT",
      payload: { component: b },
    } as Action);
    assert.deepEqual(next.components, [a, b]);
  });

  test("UPDATE_COMPONENT replaces in place", () => {
    const a = component("a");
    const c = component("c");
    const next = reducer(state([a, component("b"), c]), {
      type: "UPDATE_COMPONENT",
      payload: { component: component("b", { name: "renamed" }) },
    } as Action);
    assert.equal(next.components.length, 3);
    assert.equal(next.components[0], a);
    assert.equal(next.components[1]?.name, "renamed");
    assert.ok((next.components[1]?.updatedAt ?? 0) > 0);
    assert.equal(next.components[2], c);
  });

  test("UPDATE_COMPONENT ignores an unknown id", () => {
    const s = state([component("a"), component("b")]);
    const next = reducer(s, {
      type: "UPDATE_COMPONENT",
      payload: { component: component("missing") },
    } as Action);
    assert.equal(next, s);
  });
});
