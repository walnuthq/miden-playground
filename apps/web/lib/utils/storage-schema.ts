// An account component's storage slots from its package's storage schema. No
// SDK import: the unit tests run on plain node.
import type { StorageSlot } from "../types/component.ts";
import type { StorageSchema } from "../types/script.ts";

// The slots a schema declares, in its order, at their defaults: the schema's
// default word for a value slot, else zero, and no entries for a map.
export const schemaStorageSlots = ({ slots }: StorageSchema): StorageSlot[] =>
  slots.map((slot) => ({
    name: slot.name,
    type: slot.type,
    value: slot.type === "value" ? (slot.defaultValue ?? "0") : "",
  }));

// The schema's slots, each with the value it was edited to when a slot of
// the same name and type was: a recompile keeps the edits of the slots it
// still has, drops the slots it no longer has and adds new ones at their
// defaults.
export const mergeStorageSlots = (
  schema: StorageSchema,
  edited: StorageSlot[],
): StorageSlot[] =>
  schemaStorageSlots(schema).map(
    (slot) =>
      edited.find(
        ({ name, type }) => name === slot.name && type === slot.type,
      ) ?? slot,
  );

// What the editor shows under each slot's name: its description and types.
export const storageSlotDescriptions = ({
  slots,
}: StorageSchema): Record<string, string> =>
  Object.fromEntries(
    slots.map((slot) => {
      const types =
        slot.type === "value"
          ? slot.valueType
          : `${slot.keyType} → ${slot.valueType}`;
      return [
        slot.name,
        slot.description ? `${slot.description} (${types})` : types,
      ];
    }),
  );
