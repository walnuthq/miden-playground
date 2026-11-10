import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isRestorable } from "./project.ts";
import { genesisBlockHeader } from "./store.ts";

const project = (overrides: Record<string, unknown> = {}) =>
  ({
    version: 1,
    kind: "project",
    id: "p",
    name: "P",
    networkId: "mtst",
    savedAt: 0,
    state: "{}",
    store: JSON.stringify({ blockHeaders: [] }),
    ...overrides,
  }) as unknown as Parameters<typeof isRestorable>[0];

const withGenesis = (data: string) =>
  JSON.stringify({
    blockHeaders: [{ blockNum: "0", header: { data } }],
  });

describe("isRestorable", () => {
  test("same network, no genesis header in the store", () => {
    assert.equal(isRestorable(project(), "mtst"), true);
  });

  test("another network", () => {
    assert.equal(isRestorable(project({ networkId: "mm" }), "mtst"), false);
  });

  test("another version", () => {
    assert.equal(isRestorable(project({ version: 2 }), "mtst"), false);
  });

  test("matching genesis header", () => {
    const store = withGenesis(genesisBlockHeader("mtst"));
    assert.equal(isRestorable(project({ store }), "mtst"), true);
  });

  test("other genesis header", () => {
    const store = withGenesis("other");
    assert.equal(isRestorable(project({ store }), "mtst"), false);
  });

  test("unparsable store", () => {
    assert.equal(isRestorable(project({ store: "not json" }), "mtst"), false);
  });

  test("network without expected genesis: store not parsed", () => {
    assert.equal(
      isRestorable(project({ networkId: "mlcl", store: "not json" }), "mlcl"),
      true,
    );
  });
});
