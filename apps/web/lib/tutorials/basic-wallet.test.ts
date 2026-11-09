import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

// Read as a file: basic-wallet.ts uses path aliases, which plain node can't
// import.
const snapshot = JSON.parse(read("./basic-wallet.json")) as {
  source: string;
  commitment: string;
  masp: string;
  exports: { Procedure: { path: string; digest: string } }[];
};

// Whether the package is still what the compiler builds needs api-compile:
// `pnpm templates:check` in apps/api does that.
describe("the embedded basic-wallet package", () => {
  test("is compiled from the basic-wallet template", () => {
    assert.equal(
      snapshot.source,
      read("../../../api/templates/basic-wallet.rs"),
    );
  });

  test("exports the procedure note scripts receive assets with", () => {
    assert.match(snapshot.commitment, /^0x[0-9a-f]{64}$/);
    assert.ok(snapshot.masp.length > 0);
    assert.deepEqual(
      snapshot.exports.map(({ Procedure: { path } }) => path),
      ["create-note", "move-asset-to-note", "receive-asset"].map(
        (name) => `::"miden:basic-wallet/basic-wallet@0.1.0"::"${name}"`,
      ),
    );
  });
});
