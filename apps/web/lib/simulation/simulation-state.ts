import { useCallback, useSyncExternalStore } from "react";
import type { StorageSlot } from "@/lib/types/component";

// The storage slots a script's simulations start from, per script. In memory
// only, like the console's log (lib/console-log.ts): not in the app state, so
// neither persisted nor saved with projects. It survives switching scripts,
// not a reload.

const slots = new Map<string, StorageSlot[]>();
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// `initial` shows until the slots are edited.
export const useSimulationStorageSlots = (
  scriptId: string,
  initial: StorageSlot[],
) => {
  const edited = useSyncExternalStore(subscribe, () => slots.get(scriptId));
  const setStorageSlots = useCallback(
    (storageSlots: StorageSlot[]) => {
      slots.set(scriptId, storageSlots);
      for (const listener of listeners) {
        listener();
      }
    },
    [scriptId],
  );
  return [edited ?? initial, setStorageSlots] as const;
};
