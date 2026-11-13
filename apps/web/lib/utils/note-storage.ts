// A note's storage from its package's note storage schema: one
// typed field per schema field, flattened to the felts the note's storage
// holds. No SDK import: the unit tests run on plain node.
import type { MidenType, NoteStorageField } from "../types/script.ts";
import {
  type ProcedureArguments,
  type ProcedureParam,
  procedureArgumentError,
} from "./procedure-inputs.ts";
import { wordFelts } from "./storage-slots.ts";

// How a field's type lowers to felts, as the compiler's `ToFeltRepr` writes
// it (`sdk/field-repr` in 0xMiden/compiler): a felt as itself, a word as its
// four elements in order, an account id as its prefix then its suffix (the
// WIT record's field order, unlike a procedure call's stack), a `u64` as its
// low then its high 32 bits, the other integers and a bool as one felt.
// `max` bounds a one-felt integer.
const fieldTypes: Record<
  string,
  { type: MidenType; label?: string; max?: bigint }
> = {
  felt: { type: "Felt" },
  word: { type: "Word" },
  "account-id": { type: "AccountId" },
  "asset-amount": { type: "Felt", label: "Amount", max: 2n ** 63n - 2n ** 31n },
  // Entered as a felt, so below the field's modulus rather than 2^64.
  u64: { type: "Felt", label: "u64" },
  u32: { type: "Felt", label: "u32", max: 2n ** 32n - 1n },
  u8: { type: "Felt", label: "u8", max: 255n },
  bool: { type: "Felt", label: "Bool, 0 or 1", max: 1n },
};

// The form's fields for a note's storage, or nothing when a field's type
// can't be entered (a record the note defines, an option, a variant): the
// note's storage is then entered as raw felts.
export const noteStorageParams = (
  fields: NoteStorageField[],
): ProcedureParam[] | undefined => {
  const params = fields.map(({ name, type }) => {
    const fieldType = fieldTypes[type];
    return (
      fieldType && {
        name,
        type: fieldType.type,
        rawType: type,
        label: fieldType.label,
      }
    );
  });
  return params.every((param) => param !== undefined) ? params : undefined;
};

// Why a field's value can't be stored, or nothing when it can.
export const noteStorageArgumentError = (
  { name, rawType }: ProcedureParam,
  args: ProcedureArguments,
) => {
  const argument = args[name];
  const error = procedureArgumentError(argument);
  if (error) {
    return error;
  }
  const max = fieldTypes[rawType]?.max;
  if (
    max !== undefined &&
    argument?.type === "Felt" &&
    BigInt(argument.value.trim()) > max
  ) {
    return `At most ${max}.`;
  }
  return undefined;
};

export const noteStorageReady = (
  params: ProcedureParam[],
  args: ProcedureArguments,
) =>
  params.every((param) => noteStorageArgumentError(param, args) === undefined);

// The note's storage: each field's felts, in declaration order, as decimal
// text. `accountIdParts` splits an account id into its two felts
// (`accountIdParts` in lib/web-client.ts).
export const noteStorageFelts = ({
  params,
  args,
  accountIdParts,
}: {
  params: ProcedureParam[];
  args: ProcedureArguments;
  accountIdParts: (accountId: string) => { prefix: bigint; suffix: bigint };
}): string[] =>
  params
    .flatMap(({ name, rawType }) => {
      const argument = args[name];
      if (!argument) {
        throw new Error(`Missing note storage field "${name}".`);
      }
      if (argument.type === "AccountId") {
        const { prefix, suffix } = accountIdParts(argument.accountId);
        return [prefix, suffix];
      }
      if (argument.type === "Word") {
        return wordFelts(argument.value);
      }
      if (argument.type === "Felt") {
        const value = BigInt(argument.value.trim());
        return rawType === "u64"
          ? [value & 0xffff_ffffn, value >> 32n]
          : [value];
      }
      // `noteStorageParams` types no field as an asset.
      throw new Error(`Unsupported note storage field "${name}".`);
    })
    .map(String);
