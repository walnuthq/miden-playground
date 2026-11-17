import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { simulatedAccountName } from "./foreign-accounts.ts";
import {
  applyVaultChanges,
  assetRowsError,
  MAX_FUNGIBLE_AMOUNT,
  resolveSimulatedAsset,
  rowAssets,
  simulatedAssetSymbol,
  simulatedAssetValue,
  symbolError,
  usedSymbols,
  vaultChanges,
} from "./simulated-assets.ts";

const SIM = simulatedAssetValue("SIM");
const USDC = simulatedAssetValue("USDC");
const SANDBOX_FAUCET = "0x4e6fb40fd2f6a55140df2c42dfb5b7";

describe("stand-ins", () => {
  test("round-trip a symbol", () => {
    assert.equal(simulatedAssetSymbol(simulatedAssetValue("LP")), "LP");
  });

  test("aren't an account id or a staged account's stand-in", () => {
    assert.equal(simulatedAssetSymbol(SANDBOX_FAUCET), undefined);
    assert.equal(simulatedAssetSymbol("simulated:counter-account"), undefined);
    assert.equal(simulatedAccountName(SIM), undefined);
  });
});

describe("symbolError", () => {
  test("takes 1 to 12 uppercase letters", () => {
    assert.equal(symbolError("USDC", ["SIM"]), undefined);
    assert.equal(symbolError("ABCDEFGHIJKL", []), undefined);
    for (const symbol of ["", "usdc", "US1", "ABCDEFGHIJKLM", "U-SD"]) {
      assert.notEqual(symbolError(symbol, []), undefined, symbol);
    }
  });

  test("refuses a symbol the list holds", () => {
    assert.match(symbolError("SIM", ["SIM"]) ?? "", /already/);
  });
});

describe("assetRowsError", () => {
  test("accepts no rows, and rows of known assets", () => {
    assert.equal(assetRowsError([], []), undefined);
    assert.equal(
      assetRowsError(
        [
          { faucetId: SIM, amount: "1000" },
          { faucetId: SANDBOX_FAUCET, amount: " 0 " },
          { faucetId: USDC, amount: MAX_FUNGIBLE_AMOUNT.toString() },
        ],
        ["SIM", "USDC"],
      ),
      undefined,
    );
  });

  test("refuses a row without an asset", () => {
    assert.match(
      assetRowsError([{ faucetId: "", amount: "1" }], ["SIM"]) ?? "",
      /Pick an asset/,
    );
  });

  test("refuses a symbol the script doesn't list", () => {
    assert.match(
      assetRowsError([{ faucetId: USDC, amount: "1" }], ["SIM"]) ?? "",
      /USDC/,
    );
  });

  test("refuses an amount that isn't a whole number in range", () => {
    for (const amount of ["", "-1", "1.5", "1e3", "abc"]) {
      assert.notEqual(
        assetRowsError([{ faucetId: SIM, amount }], ["SIM"]),
        undefined,
        amount,
      );
    }
    assert.match(
      assetRowsError(
        [{ faucetId: SIM, amount: (MAX_FUNGIBLE_AMOUNT + 1n).toString() }],
        ["SIM"],
      ) ?? "",
      /at most/,
    );
  });

  test("refuses an asset twice", () => {
    assert.match(
      assetRowsError(
        [
          { faucetId: SIM, amount: "1" },
          { faucetId: SIM, amount: "2" },
        ],
        ["SIM"],
      ) ?? "",
      /one row/,
    );
  });
});

describe("rowAssets", () => {
  test("parses the amounts and drops those at zero", () => {
    assert.deepEqual(
      rowAssets([
        { faucetId: SIM, amount: " 1000 " },
        { faucetId: USDC, amount: "0" },
      ]),
      [{ faucetId: SIM, amount: 1000n }],
    );
  });
});

describe("usedSymbols", () => {
  test("lists each simulated asset once, and nothing else", () => {
    assert.deepEqual(usedSymbols([SIM, SANDBOX_FAUCET, USDC, SIM, ""]), [
      "SIM",
      "USDC",
    ]);
  });
});

describe("applyVaultChanges", () => {
  test("sets the changed rows to their final balance, in place", () => {
    assert.deepEqual(
      applyVaultChanges(
        [
          { faucetId: SIM, amount: "1000" },
          { faucetId: USDC, amount: "5" },
        ],
        [{ faucetId: SIM, amount: 600n }],
      ),
      [
        { faucetId: SIM, amount: "600" },
        { faucetId: USDC, amount: "5" },
      ],
    );
  });

  test("keeps a row spent to zero", () => {
    assert.deepEqual(
      applyVaultChanges(
        [{ faucetId: SIM, amount: "1000" }],
        [{ faucetId: SIM, amount: 0n }],
      ),
      [{ faucetId: SIM, amount: "0" }],
    );
  });

  test("adds a row for an asset received", () => {
    assert.deepEqual(
      applyVaultChanges(
        [{ faucetId: SIM, amount: "1000" }],
        [{ faucetId: USDC, amount: 50n }],
      ),
      [
        { faucetId: SIM, amount: "1000" },
        { faucetId: USDC, amount: "50" },
      ],
    );
  });
});

describe("resolveSimulatedAsset", () => {
  const faucetIds = new Map([["SIM", "0xfaucet"]]);

  test("replaces a stand-in by its faucet's id", () => {
    assert.equal(resolveSimulatedAsset(SIM, faucetIds), "0xfaucet");
  });

  test("leaves any other value", () => {
    assert.equal(
      resolveSimulatedAsset(SANDBOX_FAUCET, faucetIds),
      SANDBOX_FAUCET,
    );
  });

  test("refuses a symbol the run didn't make", () => {
    assert.throws(() => resolveSimulatedAsset(USDC, faucetIds), /USDC/);
  });
});

describe("vaultChanges", () => {
  test("names the simulated assets by stand-in, and drops other faucets", () => {
    assert.deepEqual(
      vaultChanges(
        [
          { faucetId: "0xfaucet", amount: 600n },
          { faucetId: SANDBOX_FAUCET, amount: 1n },
        ],
        new Map([["SIM", "0xfaucet"]]),
      ),
      [{ faucetId: SIM, amount: 600n }],
    );
  });
});
