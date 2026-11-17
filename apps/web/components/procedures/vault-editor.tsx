import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import SelectAccountDropdownMenu from "@/components/transactions/select-account-dropdown-menu";
import {
  type AssetRow,
  assetRowsError,
  MAX_FUNGIBLE_AMOUNT,
  symbolError,
} from "@/lib/simulation/simulated-assets";

const NO_ACCOUNTS = new Set<string>();

const amountValid = (amount: string) =>
  /^[0-9]+$/.test(amount.trim()) &&
  BigInt(amount.trim()) <= MAX_FUNGIBLE_AMOUNT;

// Adds a symbol to the script's simulated assets.
const NewAsset = ({
  label,
  symbols,
  onNewAsset,
}: {
  label: string;
  symbols: string[];
  onNewAsset: (symbol: string) => void;
}) => {
  const [symbol, setSymbol] = useState("");
  const error = symbol === "" ? undefined : symbolError(symbol, symbols);
  return (
    <form
      className="flex flex-col gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        if (symbol !== "" && !error) {
          onNewAsset(symbol);
          setSymbol("");
        }
      }}
    >
      <div className="flex items-center gap-1.5">
        <Input
          aria-label={`New ${label} asset symbol`}
          className="h-8 min-w-0 flex-1 font-mono"
          placeholder="Symbol, e.g. USDC"
          value={symbol}
          aria-invalid={error !== undefined}
          onChange={(event) => setSymbol(event.target.value.toUpperCase())}
        />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={symbol === "" || error !== undefined}
        >
          <Plus />
          New asset
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
};

// Rows of an asset and an amount in base units: an account's vault, or the
// assets a note carries. `simulatedAssets` are offered in the dropdowns'
// "Simulated" group; `sandboxFaucets` offers the sandbox's faucets too.
// `onNewAsset` adds a symbol to the simulated assets, `symbols` being those
// there are. It knows nothing about what runs a procedure: the rows are the
// caller's. `label` names the rows for assistive technology ("vault", "note").
const VaultEditor = ({
  label,
  rows,
  onChange,
  simulatedAssets,
  sandboxFaucets = false,
  symbols,
  onNewAsset,
  empty,
}: {
  label: string;
  rows: AssetRow[];
  onChange: (rows: AssetRow[]) => void;
  simulatedAssets: { value: string; name: string }[];
  sandboxFaucets?: boolean;
  symbols: string[];
  onNewAsset?: (symbol: string) => void;
  // What shows when there are no rows.
  empty: string;
}) => {
  const error = assetRowsError(rows, symbols);
  const setRow = (index: number, row: AssetRow) =>
    onChange(rows.with(index, row));
  return (
    // A fieldset's `min-width: min-content` would overflow a phone.
    <fieldset
      aria-label={`${label} assets`}
      className="flex min-w-0 flex-col gap-2 rounded-md border p-2 text-sm"
    >
      {rows.length === 0 && <p className="text-muted-foreground">{empty}</p>}
      {rows.map((row, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id, only their position.
        <div key={index} className="flex items-center gap-1.5">
          <SelectAccountDropdownMenu
            value={row.faucetId}
            onValueChange={(next) =>
              setRow(index, {
                ...row,
                faucetId:
                  typeof next === "function" ? next(row.faucetId) : next,
              })
            }
            selectFaucets
            showFaucetsAsAssets
            simulatedAccounts={simulatedAssets}
            accountIds={sandboxFaucets ? undefined : NO_ACCOUNTS}
          />
          <Input
            aria-label={`${label} amount ${index + 1}`}
            className="h-8 min-w-0 flex-1 font-mono"
            placeholder="Amount"
            inputMode="numeric"
            value={row.amount}
            aria-invalid={!amountValid(row.amount)}
            onChange={(event) =>
              setRow(index, { ...row, amount: event.target.value })
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${label} asset ${index + 1}`}
            onClick={() => onChange(rows.toSpliced(index, 1))}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      {rows.length > 0 && error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() =>
          onChange([
            ...rows,
            {
              // The first simulated asset no row holds, when only those are
              // offered.
              faucetId: sandboxFaucets
                ? ""
                : (simulatedAssets.find(
                    ({ value }) => !rows.some((row) => row.faucetId === value),
                  )?.value ?? ""),
              amount: "",
            },
          ])
        }
      >
        <Plus />
        Add asset
      </Button>
      {onNewAsset && (
        <NewAsset label={label} symbols={symbols} onNewAsset={onNewAsset} />
      )}
    </fieldset>
  );
};

export default VaultEditor;
