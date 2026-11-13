import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Script } from "@/lib/types/script";
import { missingProcedures, procedureName } from "./account-procedures.ts";

const increment =
  "0xfd4baa4cdaad14d4649856647535ba44b49b8bd6004b57f183801ccc5b44b879";
const getCount =
  "0xd5fc8175e38bc8de732d1b74a6622043e302b6d4252ab80b494927312246b159";

const script = (procedureExports: { path: string; digest: string }[]) =>
  ({ procedureExports }) as unknown as Script;

const counter = script([
  {
    path: '::"miden:counter-account/counter-contract@0.1.0"::"get-count"',
    digest: getCount,
  },
  {
    path: '::"miden:counter-account/counter-contract@0.1.0"::"increment-count"',
    digest: increment,
  },
]);

describe("missingProcedures", () => {
  test("lists the roots the code lacks, in order", () => {
    assert.deepEqual(
      missingProcedures([getCount, increment], (root) => root === getCount),
      [increment],
    );
  });

  test("is empty when the code has every root, or there is none", () => {
    assert.deepEqual(
      missingProcedures([getCount, increment], () => true),
      [],
    );
    assert.deepEqual(
      missingProcedures([], () => false),
      [],
    );
  });
});

describe("procedureName", () => {
  test("names a root by its export path's last segment", () => {
    assert.equal(procedureName(increment, [counter]), "increment-count");
  });

  test("takes the first script that exports it", () => {
    const other = script([
      { path: "::lib::other::increment", digest: increment },
    ]);
    assert.equal(procedureName(increment, [other, counter]), "increment");
  });

  test("compares case-insensitively, with or without 0x", () => {
    assert.equal(
      procedureName(increment.slice(2).toUpperCase(), [counter]),
      "increment-count",
    );
    const upper = script([
      {
        path: "::wallet::receive_asset",
        digest: `0X${getCount.slice(2).toUpperCase()}`,
      },
    ]);
    assert.equal(procedureName(getCount, [upper]), "receive_asset");
  });

  test("shortens an unknown root", () => {
    assert.equal(procedureName(increment, []), "0xfd4b…b879");
    assert.equal(procedureName(increment, [script([])]), "0xfd4b…b879");
  });
});
