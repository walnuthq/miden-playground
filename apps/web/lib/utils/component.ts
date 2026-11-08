// Plain node runs the unit test of lib/tutorials/counter-account.ts, which
// imports this module: relative imports only.
import type { Component } from "../types/component.ts";
import { snakeCase } from "./case.ts";

// Unused at the moment. Needs StorageSlot imported from @/lib/types/component.
// export const defaultStorageSlot = (): StorageSlot => ({
//   name: "",
//   type: "value",
//   value: "0",
// });

// A component's storage slot name, as the compiler derives it
// (`derive_storage_slot_name` in miden-base-macros): the package name as it
// is, with every character outside [A-Za-z0-9_] replaced by `_`, then the
// trait in snake case, then the field. The package name isn't split into
// words: `counter2` stays `counter2`, where snakeCase gives `counter_2`.
export const storageSlotName = ({
  packageName,
  traitName,
  fieldName,
}: {
  packageName: string;
  traitName: string;
  fieldName: string;
}) =>
  `${packageName.replace(/[^A-Za-z0-9_]/g, "_")}::${snakeCase(traitName)}::${fieldName}`;

export const defaultComponent = (): Component => ({
  id: "",
  name: "",
  type: "account-component",
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
