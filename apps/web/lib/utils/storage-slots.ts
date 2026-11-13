// A component's storage slots as text (`StorageSlot`), to and from words. No
// SDK import: the unit tests run on plain node.
import type { StorageItem } from "../types/account.ts";
import type { StorageSlot } from "../types/component.ts";
import { keyValuesToString, stringToKeyValues } from "./component.ts";
import { isFelt, isWord, wordToHex } from "./procedure-inputs.ts";

// A slot value, a map key or a map value is written as a felt, which fills a
// word's first element, or as a whole word in hex.
export const isWordText = (text: string) => isFelt(text) || isWord(text);

// The four felts of a word in hex, each 8 little-endian bytes.
const hexToFelts = (hex: string) =>
  Array.from({ length: 4 }, (_, felt) =>
    Array.from({ length: 8 }, (_, byte) =>
      BigInt(
        `0x${hex.slice(2 + 16 * felt + 2 * byte, 4 + 16 * felt + 2 * byte)}`,
      ),
    ).reduce((value, byte, index) => value | (byte << BigInt(8 * index)), 0n),
  );

// The word a text stands for. An empty text is the empty word.
export const wordFelts = (text: string) => {
  const trimmed = text.trim();
  if (isWord(trimmed)) {
    return hexToFelts(trimmed);
  }
  return [trimmed === "" ? 0n : BigInt(trimmed), 0n, 0n, 0n];
};

export const wordTextToHex = (text: string) => wordToHex(wordFelts(text));

// The shortest text for a word: its first felt when the others are zero.
export const wordHexToText = (hex: string) => {
  const [first = 0n, ...rest] = hexToFelts(hex);
  return rest.every((felt) => felt === 0n) ? first.toString() : hex;
};

// Why a slot can't be built, or nothing when it can.
export const storageSlotError = ({ name, type, value }: StorageSlot) => {
  if (name.trim() === "") {
    return "The slot needs a name.";
  }
  if (type === "value") {
    return isWordText(value) ? undefined : "Not a felt or a word.";
  }
  const entries = stringToKeyValues(value);
  if (
    entries.some(({ key, value }) => !isWordText(key) || !isWordText(value))
  ) {
    return "Keys and values are felts or words.";
  }
  const keys = entries.map(({ key }) => wordTextToHex(key));
  return new Set(keys).size === keys.length ? undefined : "Duplicate key.";
};

export const storageSlotsValid = (storageSlots: StorageSlot[]) =>
  storageSlots.every((storageSlot) => !storageSlotError(storageSlot)) &&
  new Set(storageSlots.map(({ name }) => name.trim())).size ===
    storageSlots.length;

// A transaction's storage changes, with words in hex: the final value of each
// changed value slot and map entry.
export type StorageChanges = {
  values: { name: string; value: string }[];
  entries: { name: string; key: string; value: string }[];
};

// The slots after a transaction's changes. Changes to slots that aren't
// listed (the account's other components') are left out.
export const applyStorageChanges = (
  storageSlots: StorageSlot[],
  { values, entries }: StorageChanges,
): StorageSlot[] =>
  storageSlots.map((storageSlot) => {
    if (storageSlot.type === "value") {
      const change = values.find(({ name }) => name === storageSlot.name);
      return change
        ? { ...storageSlot, value: wordHexToText(change.value) }
        : storageSlot;
    }
    const changes = entries.filter(({ name }) => name === storageSlot.name);
    if (changes.length === 0) {
      return storageSlot;
    }
    const changed = new Map(changes.map(({ key, value }) => [key, value]));
    const kept = stringToKeyValues(storageSlot.value).map(({ key, value }) => {
      const hex = wordTextToHex(key);
      const next = changed.get(hex);
      changed.delete(hex);
      return { key, value: next === undefined ? value : wordHexToText(next) };
    });
    return {
      ...storageSlot,
      value: keyValuesToString([
        ...kept,
        ...[...changed].map(([key, value]) => ({
          key: wordHexToText(key),
          value: wordHexToText(value),
        })),
      ]),
    };
  });

const EMPTY_WORD_HEX = wordToHex([0n, 0n, 0n, 0n]);

// The changes that differ from the account's storage before the transaction
// (`Account.storage`). A transaction on a new account reports every slot as
// created, changed or not.
export const effectiveStorageChanges = (
  storage: StorageItem[],
  { values, entries }: StorageChanges,
): StorageChanges => {
  const item = (name: string) => storage.find((item) => item.name === name);
  return {
    values: values.filter(
      ({ name, value }) => (item(name)?.item || EMPTY_WORD_HEX) !== value,
    ),
    entries: entries.filter(
      ({ name, key, value }) =>
        (item(name)?.mapEntries.find((entry) => entry.key === key)?.value ??
          EMPTY_WORD_HEX) !== value,
    ),
  };
};
