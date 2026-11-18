// An account component's storage slot as text: its name, its type, and its
// value (a felt or a hex word; for a map, `key:value` pairs joined by commas,
// see lib/utils/storage-slots.ts).
export const storageSlotTypes = { value: "Value", map: "Map" } as const;

export type StorageSlotType = keyof typeof storageSlotTypes;

export type StorageSlot = {
  name: string;
  type: StorageSlotType;
  value: string;
};
