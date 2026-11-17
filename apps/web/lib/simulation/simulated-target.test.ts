import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { ProcedureExport, Script } from "../types/script.ts";
import { SIMULATED_PREFIX } from "./foreign-accounts.ts";
import { simulatedAssetValue } from "./simulated-assets.ts";
import {
  SIMULATED_TARGET,
  simulatedTargetMissing,
} from "./simulated-target.ts";

const procedure = (path: string, digest: string) =>
  ({ path, digest }) as ProcedureExport;

const script = (fields: Partial<Script>) =>
  ({
    procedureExports: [],
    ...fields,
  }) as Script;

// The Rust basic wallet's `receive-asset` (lib/tutorials/basic-wallet.json),
// which the P2ID template calls.
const RECEIVE_ASSET =
  "0x086e7fa3ab688ac1d4f215c53ba517b68c4c8d43418f6b8a0ac1f1b9a8a1db20";
const rustWallet = script({
  procedureExports: [
    procedure(
      '::"miden:basic-wallet/basic-wallet@0.1.0"::"receive-asset"',
      RECEIVE_ASSET,
    ),
  ],
});

// The standard basic wallet, which every simulated account holds: another
// root for its `receive_asset`.
const STANDARD_RECEIVE_ASSET =
  "0xd7416b798a70aabbca510c3cd0f48ba35473b5d76dc302375157c6f563fffc15";
const standardWallet = script({
  procedureExports: [
    procedure(
      "::miden::standards::components::wallets::basic_wallet::receive_asset",
      STANDARD_RECEIVE_ASSET,
    ),
  ],
});

const GET_COUNT =
  "0xd5fc8175e38bc8de732d1b74a6622043e302b6d4252ab80b494927312246b159";
const INCREMENT_COUNT =
  "0xfd4baa4cdaad14d4649856647535ba44b49b8bd6004b57f183801ccc5b44b879";
const counter = script({
  procedureExports: [
    procedure(
      '::"miden:counter-account/counter-contract@0.1.0"::"get-count"',
      GET_COUNT,
    ),
    procedure(
      '::"miden:counter-account/counter-contract@0.1.0"::"increment-count"',
      INCREMENT_COUNT,
    ),
  ],
});

const named = [counter, standardWallet, rustWallet];
const builtIns = [standardWallet];

const p2id = script({ metadata: { accountProcedures: [RECEIVE_ASSET] } });
const incrementNote = script({
  metadata: { accountProcedures: [GET_COUNT, INCREMENT_COUNT] },
});

describe("simulatedTargetMissing", () => {
  test("P2ID lacks the Rust wallet's receive-asset without it", () => {
    assert.deepEqual(
      simulatedTargetMissing({
        script: p2id,
        components: [],
        builtIns,
        named,
      }),
      ["receive-asset"],
    );
  });

  test("P2ID lacks nothing with the Rust wallet", () => {
    assert.deepEqual(
      simulatedTargetMissing({
        script: p2id,
        components: [rustWallet],
        builtIns,
        named,
      }),
      [],
    );
  });

  test("the counter note lacks nothing with the counter, roots in any case", () => {
    assert.deepEqual(
      simulatedTargetMissing({
        script: script({
          metadata: {
            accountProcedures: [GET_COUNT.toUpperCase().replace("0X", "0x")],
          },
        }),
        components: [counter],
        builtIns,
        named,
      }),
      [],
    );
    assert.deepEqual(
      simulatedTargetMissing({
        script: incrementNote,
        components: [counter],
        builtIns,
        named,
      }),
      [],
    );
  });

  test("a script with no dependency lacks what it calls", () => {
    assert.deepEqual(
      simulatedTargetMissing({
        script: incrementNote,
        components: [],
        builtIns,
        named,
      }),
      ["get-count", "increment-count"],
    );
  });

  test("a script calling only the standard wallet lacks nothing", () => {
    assert.deepEqual(
      simulatedTargetMissing({
        script: script({
          metadata: {
            accountProcedures: [STANDARD_RECEIVE_ASSET],
          },
        }),
        components: [],
        builtIns,
        named,
      }),
      [],
    );
  });

  test("no list of account procedures, nothing missing", () => {
    for (const metadata of [{ accountProcedures: null }, {}, undefined, null]) {
      assert.deepEqual(
        simulatedTargetMissing({
          script: script({ metadata }),
          components: [],
          builtIns,
          named,
        }),
        [],
      );
    }
  });
});

describe("stand-ins", () => {
  test("the target's and the asset's are distinct simulated values", () => {
    assert.ok(SIMULATED_TARGET.startsWith(SIMULATED_PREFIX));
    const asset = simulatedAssetValue("TARGET");
    assert.ok(asset.startsWith(SIMULATED_PREFIX));
    assert.notEqual(SIMULATED_TARGET, asset);
  });
});
