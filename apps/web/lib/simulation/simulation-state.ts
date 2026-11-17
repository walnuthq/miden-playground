import { useCallback, useSyncExternalStore } from "react";
import {
  type AssetRow,
  DEFAULT_SIMULATED_ASSET,
} from "@/lib/simulation/simulated-assets";
import type { StorageSlot } from "@/lib/types/component";

// The storage slots a script's simulations start from, per script, and those
// of the foreign accounts staged for it (`foreignSlotsKey`). In memory only,
// like the console's log (lib/console-log.ts): not in the app state, so
// neither persisted nor saved with projects. It survives switching scripts,
// not a reload.

// Replaced on every edit, so it is its own snapshot.
let slots = new Map<string, StorageSlot[]>();
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

const getSnapshot = () => slots;

// The key of the slots of a foreign account staged for a script's runs.
export const foreignSlotsKey = (scriptId: string, dependencyName: string) =>
  `${scriptId}:foreign:${dependencyName}`;

export const setSimulationStorageSlots = (
  key: string,
  storageSlots: StorageSlot[],
) => {
  slots = new Map(slots).set(key, storageSlots);
  notify();
};

// Every edited set of slots, by key: for a variable number of keys.
export const useEditedStorageSlots = () =>
  useSyncExternalStore(subscribe, getSnapshot);

// `initial` shows until the slots are edited.
export const useSimulationStorageSlots = (
  key: string,
  initial: StorageSlot[],
) => {
  const edited = useEditedStorageSlots().get(key);
  const setStorageSlots = useCallback(
    (storageSlots: StorageSlot[]) =>
      setSimulationStorageSlots(key, storageSlots),
    [key],
  );
  return [edited ?? initial, setStorageSlots] as const;
};

// The vault a script's simulations start from: the throwaway account's of an
// account component, the simulated account's of a note or transaction script
// (one account, one vault, whatever its dependencies). Keyed by the script's
// id: a script is one kind or the other. And the symbols of the script's
// simulated assets. In memory, like the slots.
let vaults = new Map<string, AssetRow[]>();
let assetSymbols = new Map<string, string[]>();

const getVaults = () => vaults;
const getAssetSymbols = () => assetSymbols;

const NO_ROWS: AssetRow[] = [];
const DEFAULT_SYMBOLS = [DEFAULT_SIMULATED_ASSET];

export const setSimulationVault = (scriptId: string, rows: AssetRow[]) => {
  vaults = new Map(vaults).set(scriptId, rows);
  notify();
};

// Empty until edited: a script that needs no asset runs as before, with no
// seed.
export const useSimulationVault = (scriptId: string) => {
  const rows = useSyncExternalStore(subscribe, getVaults).get(scriptId);
  const setRows = useCallback(
    (next: AssetRow[]) => setSimulationVault(scriptId, next),
    [scriptId],
  );
  return [rows ?? NO_ROWS, setRows] as const;
};

// `SIM` until the user adds another.
export const useSimulatedAssetSymbols = (scriptId: string) => {
  const symbols =
    useSyncExternalStore(subscribe, getAssetSymbols).get(scriptId) ??
    DEFAULT_SYMBOLS;
  const addSymbol = useCallback(
    (symbol: string) => {
      const current = assetSymbols.get(scriptId) ?? DEFAULT_SYMBOLS;
      if (!current.includes(symbol)) {
        assetSymbols = new Map(assetSymbols).set(scriptId, [
          ...current,
          symbol,
        ]);
        notify();
      }
    },
    [scriptId],
  );
  return [symbols, addSymbol] as const;
};
