export const componentTypes = {
  account: "Account Component",
  "authentication-component": "Authentication Component",
} as const;

export type ComponentType = keyof typeof componentTypes;

export const storageSlotTypes = { value: "Value", map: "Map" } as const;

export type StorageSlotType = keyof typeof storageSlotTypes;

export type StorageSlot = {
  name: string;
  type: StorageSlotType;
  value: string;
};

export type Component = {
  id: string;
  name: string;
  type: ComponentType;
  scriptId: string;
  storageSlots: StorageSlot[];
  updatedAt: number;
};
