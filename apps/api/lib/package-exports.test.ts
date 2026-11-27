import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzedExports } from "./package-exports.ts";
import type { Manifest, ProcedureExport } from "./types.ts";

const DEPOSIT = "::bank_account::deposit";
const INITIALIZE = "::bank_account::initialize";

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
  { name: "depositor", type: "AccountId" },
  { name: "deposit_asset", type: "Asset" },
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
    // An older api-compile, or an export without names.
    for (const parametersByPath of [undefined, {}]) {
      const [deposit] = analyzedExports(manifest, {
        readOnly: {},
        parameters: parametersByPath,
      });
      assert.equal(deposit && "parameters" in deposit.Procedure, false);
    }
  });

  it("keeps a procedure that declares no signature, as untyped", () => {
    // `pub proc add`, its stack effect in a comment: a null signature in the
    // manifest.
    const ADD = "::counter::add";
    const [add] = analyzedExports(
      {
        exports: [
          {
            Procedure: {
              path: ADD,
              digest: "0x00",
              signature: null,
              attributes: { attrs: [] },
            },
          },
        ],
        dependencies: [],
      },
      { readOnly: { [ADD]: false }, callsForeign: { [ADD]: false } },
    );
    assert.deepEqual(add?.Procedure.signature, {
      abi: 3,
      params: [],
      results: [],
    });
    assert.equal(add?.Procedure.untyped, true);
    assert.equal(add?.Procedure.readOnly, false);
    // A procedure with a signature isn't marked.
    const [deposit] = analyzedExports(manifest, { readOnly: {} });
    assert.equal(deposit && "untyped" in deposit.Procedure, false);
  });

  it("leaves out a type the source exports", () => {
    // `pub type Pair = struct { first: felt, second: felt }`, as api-compile
    // answers it.
    const exports = analyzedExports(
      {
        exports: [
          {
            Type: {
              path: "::probe::Pair",
              ty: { Struct: { name: "Pair", size: 8, fields: [] } },
            },
          },
          procedure(DEPOSIT),
        ],
        dependencies: [],
      },
      { readOnly: {} },
    );
    assert.deepEqual(
      exports.map(({ Procedure: { path } }) => path),
      [DEPOSIT],
    );
  });
});
