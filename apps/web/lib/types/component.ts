import { type Account as WasmAccount } from "@demox-labs/miden-sdk";

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

export const procedureTypes = { felt: "Felt" } as const;

export type ProcedureType = keyof typeof procedureTypes;

export type StorageRead =
  | {
      type: "value";
      index: number;
    }
  | {
      type: "map";
      index: number;
      key: bigint[];
    };

export type Procedure = {
  name: string;
  args: ProcedureType[];
  returnType: ProcedureType;
  readOnly: boolean;
  storageRead?: StorageRead;
};

export type Component = {
  id: string;
  name: string;
  type: ComponentType;
  scriptId: string;
  storageSlots: StorageSlot[];
  procedures: Procedure[];
  updatedAt: number;
};

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

export const getStorageRead = async (
  wasmAccount: WasmAccount,
  storageRead: StorageRead
) => {
  if (storageRead.type === "map" && storageRead.key) {
    const { Word: WasmWord } = await import("@demox-labs/miden-sdk");
    return wasmAccount
      .storage()
      .getMapItem(
        storageRead.index,
        new WasmWord(BigUint64Array.from(storageRead.key))
      );
  } else {
    return wasmAccount.storage().getItem(storageRead.index);
  }
};
