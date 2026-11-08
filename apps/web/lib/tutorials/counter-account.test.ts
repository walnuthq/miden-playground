import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import {
  counterAccountComponent,
  counterAccountScript,
  rust,
} from "./counter-account.ts";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

type Snapshot = {
  packages: Record<
    string,
    {
      masp: string;
      commitment: string;
      exports: {
        Procedure: {
          path: string;
          digest: string;
          readOnly: boolean | null;
          attributes: unknown;
        };
      }[];
    }
  >;
};

// The example's snapshot, which `pnpm examples:compile` in apps/api
// regenerates: the embed must be updated with it.
const snapshot = (
  JSON.parse(
    read("../../../api/examples/counter-contract/compiled.json"),
  ) as Snapshot
).packages["counter-account"];
if (!snapshot) {
  throw new Error("counter-account is missing from compiled.json");
}

describe("the embedded counter-account package", () => {
  test("is the counter example's compiled.json snapshot", () => {
    assert.equal(counterAccountScript.commitment, snapshot.commitment);
    assert.equal(counterAccountScript.masp, snapshot.masp);
    assert.deepEqual(
      counterAccountScript.procedureExports.map(
        ({ path, digest, readOnly, attributes }) => ({
          path,
          digest,
          readOnly,
          attributes,
        }),
      ),
      snapshot.exports.map(
        ({ Procedure: { path, digest, readOnly, attributes } }) => ({
          path,
          digest,
          readOnly,
          attributes,
        }),
      ),
    );
  });

  test("its source is the counter-account template", () => {
    assert.equal(rust, read("../../../api/templates/counter-account.rs"));
    assert.equal(counterAccountScript.files["src/lib.rs"], rust);
  });

  test("its component's slot follows the package name", () => {
    assert.equal(counterAccountComponent.scriptId, counterAccountScript.id);
    assert.deepEqual(
      counterAccountComponent.storageSlots.map(({ name }) => name),
      ["counter_account::counter_contract::count_map"],
    );
  });
});
