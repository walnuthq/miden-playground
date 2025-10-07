export const componentTypes = {
  account: "Account Component",
  auth: "Auth Component",
} as const;

export type ComponentType = keyof typeof componentTypes;

export const storageSlotTypes = { value: "Value", map: "Storage Map" } as const;

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

export const defaultComponent = (): Component => ({
  id: "",
  name: "",
  type: "account",
  scriptId: "",
  storageSlots: [],
  updatedAt: 0,
});

export const stringToKeyValues = (value: string) => {
  if (value === "") {
    return [];
  }
  const keyValuePairs = value.split(",");
  return keyValuePairs.map((pair) => {
    const [key, value] = pair.split(":");
    return { key: key!, value: value! };
  });
};

export const keyValuesToString = (value: { key: string; value: string }[]) =>
  value.map(({ key, value }) => `${key}:${value}`).join(",");
