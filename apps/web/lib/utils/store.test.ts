import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { genesisBlockHeader, isBelowMigrationBaseline } from "./store.ts";

describe("isBelowMigrationBaseline", () => {
  const cases: [string | null, boolean][] = [
    [null, true],
    ["0.16.9", true],
    ["0.17.0-rc.1", true],
    ["0.17.0", false],
    ["0.17.8", false],
    ["1.0.0", false],
    ["0.9.20", true],
    ["not-a-version", false],
    ["0.17", false],
  ];
  for (const [version, expected] of cases) {
    test(`${version}: ${expected}`, () => {
      assert.equal(isBelowMigrationBaseline(version), expected);
    });
  }
});

describe("genesisBlockHeader", () => {
  test("public networks have one", () => {
    for (const id of ["mtst", "mm"] as const) {
      const header = genesisBlockHeader(id);
      assert.equal(typeof header, "string");
      assert.notEqual(header, "");
    }
  });

  test("other networks have none", () => {
    for (const id of ["mlcl", "mmck", "mdev"] as const) {
      assert.equal(genesisBlockHeader(id), "");
    }
  });
});
