import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzedExports } from "./package-exports.ts";
import type { Manifest, ProcedureExport } from "./types.ts";

const DEPOSIT = '::"miden:bank-account/bank@0.1.0"::deposit';
const INITIALIZE = '::"miden:bank-account/bank@0.1.0"::initialize';

const procedure = (path: string, abi = 3): { Procedure: ProcedureExport } => ({
  Procedure: {
    path,
    digest: "0x00",
    signature: { abi, params: [], results: [] },
    attributes: { attrs: [] },
  },
});

const manifest: Manifest = {
  exports: [procedure(DEPOSIT), procedure(INITIALIZE), procedure("init", 0)],
  dependencies: [],
};

const parameters = [
  { name: "depositor", type: "account-id" },
  { name: "deposit-asset", type: "asset" },
];

describe("analyzedExports", () => {
  it("stores the analysis with each Component Model export", () => {
    const exports = analyzedExports(manifest, {
      readOnly: { [DEPOSIT]: false, [INITIALIZE]: null },
      callsForeign: { [DEPOSIT]: false },
      parameters: { [DEPOSIT]: parameters, [INITIALIZE]: [] },
    });
    assert.deepEqual(
      exports.map(({ Procedure: { path } }) => path),
      [DEPOSIT, INITIALIZE],
    );
    const [deposit, initialize] = exports.map(({ Procedure }) => Procedure);
    assert.equal(deposit?.readOnly, false);
    assert.equal(deposit?.callsForeign, false);
    assert.deepEqual(deposit?.parameters, parameters);
    assert.equal(initialize?.readOnly, null);
    assert.equal(initialize?.callsForeign, undefined);
    assert.deepEqual(initialize?.parameters, []);
  });

  it("leaves out the names api-compile didn't report", () => {
    // An older api-compile, a transaction script, or an export without names.
    for (const parametersByPath of [undefined, {}]) {
      const [deposit] = analyzedExports(manifest, {
        readOnly: {},
        parameters: parametersByPath,
      });
      assert.equal(deposit && "parameters" in deposit.Procedure, false);
    }
  });
});
