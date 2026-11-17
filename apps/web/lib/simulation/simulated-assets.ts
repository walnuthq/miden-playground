import { SIMULATED_PREFIX } from "./foreign-accounts.ts";

// The simulated assets of a script's simulations: fungible assets issued by
// faucets of the mock client, one per symbol, made on first use. A faucet's
// id is known only once its client made it, and a reset client makes new
// ones: the form holds stand-ins (`simulatedAssetValue`), resolved during the
// run. No decimals: amounts are base units. No SDK import: the unit tests run
// on plain node.

const SIMULATED_ASSET_PREFIX = `${SIMULATED_PREFIX}asset:`;

// The symbol every script's list starts with.
export const DEFAULT_SIMULATED_ASSET = "SIM";

// What an asset or faucet field holds when a simulated asset is picked.
export const simulatedAssetValue = (symbol: string) =>
  `${SIMULATED_ASSET_PREFIX}${symbol}`;

// The simulated assets, as the dropdowns offer them.
export const simulatedAssetOptions = (symbols: string[]) =>
  symbols.map((symbol) => ({
    value: simulatedAssetValue(symbol),
    name: symbol,
  }));

// The symbol, when the value is a simulated asset's stand-in.
export const simulatedAssetSymbol = (value: string) =>
  value.startsWith(SIMULATED_ASSET_PREFIX)
    ? value.slice(SIMULATED_ASSET_PREFIX.length)
    : undefined;

// A faucet's token symbol: 1 to 12 uppercase letters (`TokenSymbol`,
// miden-protocol 0.17.1 `src/asset/token_symbol.rs`).
export const symbolError = (symbol: string, symbols: string[]) =>
  !/^[A-Z]{1,12}$/.test(symbol)
    ? "A symbol is 1 to 12 uppercase letters."
    : symbols.includes(symbol)
      ? `${symbol} is already a simulated asset.`
      : undefined;

// The most a fungible asset can hold, in base units: 2^63 - 2^31.
export const MAX_FUNGIBLE_AMOUNT = 2n ** 63n - 2n ** 31n;

// A row of a vault, or of the assets a note carries: a faucet (a sandbox
// faucet's id, or a simulated asset's stand-in) and an amount, as typed.
export type AssetRow = { faucetId: string; amount: string };

const amountError = (amount: string) => {
  const trimmed = amount.trim();
  if (!/^[0-9]+$/.test(trimmed)) {
    return "An amount is a whole number of base units.";
  }
  return BigInt(trimmed) > MAX_FUNGIBLE_AMOUNT
    ? `An amount is at most ${MAX_FUNGIBLE_AMOUNT}.`
    : undefined;
};

// Why the rows can't be used, if they can't: an asset to pick, a stand-in of
// a symbol the script doesn't list, an amount out of range, an asset twice.
export const assetRowsError = (rows: AssetRow[], symbols: string[]) => {
  for (const { faucetId, amount } of rows) {
    if (faucetId === "") {
      return "Pick an asset in every row.";
    }
    const symbol = simulatedAssetSymbol(faucetId);
    if (symbol !== undefined && !symbols.includes(symbol)) {
      return `${symbol} isn't a simulated asset of this script.`;
    }
    const error = amountError(amount);
    if (error) {
      return error;
    }
  }
  const faucetIds = rows.map(({ faucetId }) => faucetId);
  return new Set(faucetIds).size === faucetIds.length
    ? undefined
    : "Each asset takes one row.";
};

// The assets the rows hold, without those at zero.
export const rowAssets = (rows: AssetRow[]) =>
  rows
    .map(({ faucetId, amount }) => ({
      faucetId,
      amount: BigInt(amount.trim()),
    }))
    .filter(({ amount }) => amount > 0n);

// The symbols of the simulated assets the values name, each once.
export const usedSymbols = (values: string[]) => [
  ...new Set(
    values.flatMap((value) => {
      const symbol = simulatedAssetSymbol(value);
      return symbol === undefined ? [] : [symbol];
    }),
  ),
];

// The vault rows after a run: each row whose asset the run changed takes its
// final balance, and an asset the vault didn't hold gets a row. `balances` are
// the final balances of the assets the run changed, by stand-in.
export const applyVaultChanges = (
  rows: AssetRow[],
  balances: { faucetId: string; amount: bigint }[],
): AssetRow[] => {
  const final = new Map(
    balances.map(({ faucetId, amount }) => [faucetId, amount.toString()]),
  );
  return [
    ...rows.map((row) => ({
      ...row,
      amount: final.get(row.faucetId) ?? row.amount,
    })),
    ...balances
      .filter(({ faucetId }) => !rows.some((row) => row.faucetId === faucetId))
      .map(({ faucetId, amount }) => ({ faucetId, amount: amount.toString() })),
  ];
};

// The faucet id a value names: a simulated asset's, among `faucetIds` (by
// symbol, those the run made), or the value itself.
export const resolveSimulatedAsset = (
  value: string,
  faucetIds: Map<string, string>,
) => {
  const symbol = simulatedAssetSymbol(value);
  if (symbol === undefined) {
    return value;
  }
  const faucetId = faucetIds.get(symbol);
  if (!faucetId) {
    throw new Error(`${symbol} isn't a simulated asset of this run.`);
  }
  return faucetId;
};

// The final balances of a run's changed assets, by stand-in, for "Apply to
// state": the simulated assets' only, the vault holds no other.
export const vaultChanges = (
  balances: { faucetId: string; amount: bigint }[],
  faucetIds: Map<string, string>,
) => {
  const symbols = new Map(
    [...faucetIds].map(([symbol, faucetId]) => [faucetId, symbol]),
  );
  return balances.flatMap(({ faucetId, amount }) => {
    const symbol = symbols.get(faucetId);
    return symbol === undefined
      ? []
      : [{ faucetId: simulatedAssetValue(symbol), amount }];
  });
};
