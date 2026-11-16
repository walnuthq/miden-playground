import { useCallback, useSyncExternalStore } from "react";
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

const getSnapshot = () => slots;

// The key of the slots of a foreign account staged for a script's runs.
export const foreignSlotsKey = (scriptId: string, dependencyName: string) =>
  `${scriptId}:foreign:${dependencyName}`;

export const setSimulationStorageSlots = (
  key: string,
  storageSlots: StorageSlot[],
) => {
  slots = new Map(slots).set(key, storageSlots);
  for (const listener of listeners) {
    listener();
  }
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
