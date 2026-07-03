import { snakeCase } from "lodash";
import type { StorageSlot, Component } from "@/lib/types/component";

export const defaultStorageSlot = (): StorageSlot => ({
  name: "",
  type: "value",
  value: "0",
});

export const storageSlotName = ({
  packageName,
  traitName,
  fieldName,
}: {
  packageName: string;
  traitName: string;
  fieldName: string;
}) => `${snakeCase(packageName)}::${snakeCase(traitName)}::${fieldName}`;

export const defaultComponent = (): Component => ({
  id: "",
  name: "",
  type: "account",
  scriptId: "",
  storageSlots: [],
  updatedAt: Date.now(),
});

export const stringToKeyValues = (value: string) => {
  if (value === "") {
    return [];
  }
  const keyValuePairs = value.split(",");
  return keyValuePairs.map((pair) => {
    const [key = "", value = ""] = pair.split(":");
    return { key, value };
  });
};

export const keyValuesToString = (value: { key: string; value: string }[]) =>
  value.map(({ key, value }) => `${key}:${value}`).join(",");
