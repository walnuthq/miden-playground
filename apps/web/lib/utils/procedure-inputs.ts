// A procedure's arguments, from a form to the `MidenInput`s a call script
// pushes, and its result, from the stack to text. No SDK import: the unit
// tests run on plain node.
import type {
  MidenInput,
  MidenType,
  MidenTypeLayout,
  MidenTypeStruct,
  ProcedureExport,
  Signature,
} from "../types/script.ts";

// The Miden field's modulus: 2^64 - 2^32 + 1.
const FELT_MODULUS = 2n ** 64n - 2n ** 32n + 1n;

// The felts a call can pass on the stack: a `call`ed procedure gets the top
// 16. The check in `procedureArgumentsReady` keeps a call within them.
export const MAX_ARGUMENT_FELTS = 16;

export type ProcedureParam = {
  name: string;
  // Undefined for a type the forms don't know (a struct the source defines,
  // a `u64`…): entered as raw felts when `feltCount` is set, and otherwise
  // the procedure can't be invoked from them.
  type?: MidenType;
  // Without a `type`: how many felts the type's layout flattens to, and each
  // one's field path in it (`feltNames`), in field order. Unset when the
  // manifest has no layout for it or the layout has a leaf that isn't a felt
  // (`feltLeaves`).
  feltCount?: number;
  feltNames?: string[];
  // The type's name, as the source spells it when the export has names
  // (`NoteTag`), else the manifest's (`u32`).
  rawType: string;
  // What the form shows next to the name, `type` when unset: a `u16` is
  // entered as a felt.
  label?: string;
  // The largest value of a `Felt` that stands for a smaller integer (a
  // `u16`, a `bool`, an enum's discriminant).
  max?: bigint;
  // The one parameter of a procedure that declares no signature
  // (`ProcedureExport.untyped`): the stack it takes, as a list of felts of
  // any length up to `MAX_ARGUMENT_FELTS`.
  stack?: true;
};

// What a form holds for one parameter.
export type ProcedureArgument =
  | { type: "Felt" | "Word"; value: string }
  | { type: "AccountId"; accountId: string }
  | { type: "Asset"; faucetId: string; amount: string }
  // A type the forms don't know, as its felts in field order.
  | { type: "Felts"; values: string[] }
  // The stack of a procedure without a signature, as typed: felts separated
  // by spaces or commas, the top of the stack first.
  | { type: "Stack"; value: string };

export type ProcedureArguments = Record<string, ProcedureArgument>;

const structOf = (type: MidenTypeLayout) =>
  typeof type === "object" && type !== null && type.Struct
    ? (type as MidenTypeStruct).Struct
    : undefined;

const arrayOf = (type: MidenTypeLayout) => {
  const array =
    typeof type === "object" && type !== null
      ? (type as { Array?: { ty?: MidenTypeLayout; len?: number } }).Array
      : undefined;
  return array?.ty !== undefined && typeof array.len === "number"
    ? { ty: array.ty, len: array.len }
    : undefined;
};

type EnumVariant = {
  name: string;
  discriminant_value: number;
  value: unknown;
};

// An enum whose variants carry no value (`NoteType`): on the stack, its
// discriminant alone.
const unitEnumOf = (type: MidenTypeLayout) => {
  const layout =
    typeof type === "object" && type !== null
      ? (type as { Enum?: { name?: string; variants?: EnumVariant[] } }).Enum
      : undefined;
  const variants = layout?.variants;
  return variants &&
    variants.length > 0 &&
    variants.every(
      ({ name, discriminant_value, value }) =>
        typeof name === "string" &&
        Number.isSafeInteger(discriminant_value) &&
        discriminant_value >= 0 &&
        (value === null || value === undefined),
    )
    ? { name: layout.name ?? "enum", variants }
    : undefined;
};

const isWordLayout = (type: MidenTypeLayout) => {
  const array = arrayOf(type);
  return array?.ty === "Felt" && array.len === 4;
};

// One of the four types the forms know, or nothing: a felt, a word (an array
// of four felts), and the protocol's `AccountId` and `Asset` structs.
const knownType = (type: MidenTypeLayout): MidenType | undefined => {
  if (type === "Felt") {
    return "Felt";
  }
  if (isWordLayout(type)) {
    return "Word";
  }
  const name = structOf(type)?.name;
  return name === "AccountId" || name === "Asset" ? name : undefined;
};

// The integers below a felt, each one felt on the stack, by their largest
// value. A `u64` takes two (`feltLeaves`).
const oneFeltIntegers: Record<string, bigint> = {
  U8: 2n ** 8n - 1n,
  U16: 2n ** 16n - 1n,
  U32: 2n ** 32n - 1n,
  I1: 1n,
};

// A parameter entered as one felt with a bound: an integer below a felt, a
// `bool` (`i1`, 0 or 1) or an enum without values (its discriminant), with
// what the form adds to its type's name.
const boundedFelt = (
  type: MidenTypeLayout,
): { detail: string; max: bigint } | undefined => {
  if (typeof type === "string") {
    const max = oneFeltIntegers[type];
    return max === undefined
      ? undefined
      : { detail: type === "I1" ? "0 or 1" : type.toLowerCase(), max };
  }
  const unitEnum = unitEnumOf(type);
  if (unitEnum) {
    const { variants } = unitEnum;
    return {
      detail: variants
        .map(({ name, discriminant_value }) => `${discriminant_value} ${name}`)
        .join(", "),
      max: BigInt(
        Math.max(
          ...variants.map(({ discriminant_value }) => discriminant_value),
        ),
      ),
    };
  }
  return undefined;
};

// A type's name in the manifest: a primitive's in lower case (`u64`), a
// struct's or an enum's own name, a word as `word`, or another kind's kind.
const rawProcedureTypeName = (type: MidenTypeLayout) => {
  if (typeof type === "string") {
    return type.toLowerCase();
  }
  if (isWordLayout(type)) {
    return "word";
  }
  const struct = structOf(type);
  if (struct) {
    return struct.name.split("::").at(-1) ?? struct.name;
  }
  const [kind, layout] = Object.entries(type)[0] ?? ["unknown"];
  const name = (layout as { name?: unknown } | undefined)?.name;
  return typeof name === "string" ? name : kind.toLowerCase();
};

// The felts a type's layout flattens to, each as its path of field names, in
// field order, the first on top of the stack: an `AccountId` is
// `["suffix", "prefix"]`, an array its elements by index, a `u64` its low
// then its high 32-bit limb (miden-core-lib's `[a_lo, a_hi]`), and an integer
// below a felt, a `bool` or an enum without values one felt. Undefined when
// the layout is missing (a hand-written signature without fields) or has
// another leaf (an enum with values).
export const feltLeaves = (
  type: MidenTypeLayout,
  path: string[] = [],
): string[] | undefined => {
  if (type === "Felt" || boundedFelt(type)) {
    return [path.join(".")];
  }
  if (type === "U64") {
    return [[...path, "lo"].join("."), [...path, "hi"].join(".")];
  }
  const array = arrayOf(type);
  if (array) {
    const leaves: string[] = [];
    for (let index = 0; index < array.len; index += 1) {
      const elementLeaves = feltLeaves(array.ty, [...path, String(index)]);
      if (!elementLeaves) {
        return undefined;
      }
      leaves.push(...elementLeaves);
    }
    return leaves;
  }
  const fields = structOf(type)?.fields;
  if (!fields) {
    return undefined;
  }
  const leaves: string[] = [];
  for (const [index, { name, ty }] of fields.entries()) {
    const fieldLeaves = feltLeaves(ty, [...path, name ?? String(index)]);
    if (!fieldLeaves) {
      return undefined;
    }
    leaves.push(...fieldLeaves);
  }
  return leaves;
};

// How many felts a type takes on the stack, or nothing (`feltLeaves`).
export const feltCount = (type: MidenTypeLayout) => feltLeaves(type)?.length;

// What the form calls each felt of a raw argument: its field path (`lo` and
// `hi` for a `u64`, `first` and `second` for a struct of two felts), or its
// position when that names nothing or isn't unique.
const feltNames = (leaves: string[]) =>
  leaves.every((name) => name !== "") && new Set(leaves).size === leaves.length
    ? leaves
    : leaves.map((_, index) => `felt ${index + 1}`);

// The parameters' names as the MASM source spells them, from the names
// api-compile reports with the export. Undefined when the list is missing (a
// package compiled before api-compile reported them), has another length than
// the signature's, or holds an empty or repeated name: the arguments are
// keyed by name, so names must be unique.
export const procedureParameterNames = ({
  signature,
  parameters,
  untyped,
}: Pick<ProcedureExport, "signature" | "parameters" | "untyped">):
  | string[]
  | undefined => {
  if (untyped || !parameters || parameters.length !== signature.params.length) {
    return undefined;
  }
  const names = parameters.map(({ name }) => name);
  return names.every((name) => name !== "") &&
    new Set(names).size === names.length
    ? names
    : undefined;
};

// A parameter's type as the source names it, when the export has names
// (`procedureParameterNames`): the manifest resolves an alias, so the basic
// wallet's `tag: NoteTag` is a `u32` there and its `recipient: NoteRecipient`
// a word. Else the manifest's name.
const sourceTypeName = (
  { parameters }: Pick<ProcedureExport, "parameters">,
  named: boolean,
  param: MidenTypeLayout,
  index: number,
) => (named && parameters?.[index]?.type) || rawProcedureTypeName(param);

// What the form calls the stack of a procedure without a signature.
export const STACK_PARAM = "stack";

// The manifest's signature has the parameters' types, the source their names.
// Without names, every parameter is named by its position: never a mix. A
// procedure that declares no signature (`pub proc add`, its stack effect in a
// comment) takes one parameter, its stack as raw felts: the manifest says
// nothing of what it reads.
export const procedureParams = (
  procedureExport: Pick<
    ProcedureExport,
    "signature" | "parameters" | "untyped"
  >,
): ProcedureParam[] => {
  if (procedureExport.untyped) {
    return [{ name: STACK_PARAM, rawType: "felts", stack: true }];
  }
  const names = procedureParameterNames(procedureExport);
  return procedureExport.signature.params.map((param, index) => {
    const name = names?.[index] ?? `param_${index}`;
    const rawType = sourceTypeName(
      procedureExport,
      names !== undefined,
      param,
      index,
    );
    const type = knownType(param);
    if (type) {
      return { name, type, rawType };
    }
    const bounded = boundedFelt(param);
    if (bounded) {
      const { detail, max } = bounded;
      return {
        name,
        type: "Felt",
        rawType,
        // `u16`, `NoteTag (u32)`, `Bool (0 or 1)`, `NoteType (0 PRIVATE, 1
        // PUBLIC)`.
        label: rawType === detail ? detail : `${rawType} (${detail})`,
        max,
      };
    }
    const leaves = feltLeaves(param);
    return {
      name,
      rawType,
      ...(leaves && {
        feltCount: leaves.length,
        feltNames: feltNames(leaves),
      }),
    };
  });
};

// An export's procedure name: the last segment of its path
// (`::counter_account::get_count` is `get_count`).
export const formatProcedureExportPath = (path: string) =>
  path.split("::").at(-1)?.replaceAll('"', "") ?? "";

export const formatProcedureExportResultType = (type: MidenTypeLayout) =>
  knownType(type);

// A procedure as its MASM signature: `proc copy_count(counter_account_id:
// AccountId)`, or its parameters' types alone when it has no names
// (`procedureParameterNames`): `proc copy_count(AccountId)`. A procedure that
// declares no signature is written as its source writes it: `proc add`.
export const procedureSignature = (procedureExport: ProcedureExport) => {
  const {
    path,
    signature: { params, results },
  } = procedureExport;
  if (procedureExport.untyped) {
    return `proc ${formatProcedureExportPath(path)}`;
  }
  const names = procedureParameterNames(procedureExport);
  let result = `proc ${formatProcedureExportPath(path)}(`;
  result += params
    .map((param, index) => {
      const type =
        formatProcedureExportResultType(param) ??
        sourceTypeName(procedureExport, names !== undefined, param, index);
      return names ? `${names[index]}: ${type}` : type;
    })
    .join(", ");
  result += ")";
  if (results.length > 0) {
    result += ` -> `;
    const resultTypes = results
      .map(
        (result) =>
          formatProcedureExportResultType(result) ??
          rawProcedureTypeName(result),
      )
      .join(", ");
    result += results.length === 1 ? resultTypes : `(${resultTypes})`;
  }
  return result;
};

// The arguments with every `AccountId` that isn't among `allowed` emptied,
// or the same object when there is none: a field whose accounts were
// restricted after one was picked.
export const withAccountIdsAmong = (
  args: ProcedureArguments,
  allowed: ReadonlySet<string>,
): ProcedureArguments => {
  const cleared = Object.entries(args).filter(
    ([, argument]) =>
      argument.type === "AccountId" &&
      argument.accountId !== "" &&
      !allowed.has(argument.accountId),
  );
  if (cleared.length === 0) {
    return args;
  }
  return {
    ...args,
    ...Object.fromEntries(
      cleared.map(([name]) => [name, { type: "AccountId", accountId: "" }]),
    ),
  };
};

export const emptyProcedureArgument = (type: MidenType): ProcedureArgument =>
  type === "AccountId"
    ? { type, accountId: "" }
    : type === "Asset"
      ? { type, faucetId: "", amount: "" }
      : { type, value: "" };

// A raw argument's empty felts: a type the forms don't know
// (`ProcedureParam.feltCount`).
export const emptyFeltsArgument = (count: number): ProcedureArgument => ({
  type: "Felts",
  values: Array.from({ length: count }, () => ""),
});

// A felt as a decimal or `0x` hex integer below the field's modulus.
export const isFelt = (value: string) => {
  if (!/^(0x[0-9a-fA-F]+|[0-9]+)$/.test(value.trim())) {
    return false;
  }
  return BigInt(value.trim()) < FELT_MODULUS;
};

// The felts of a stack as typed (`ProcedureArgument`'s `Stack`): separated by
// spaces or commas, none when empty.
export const stackFelts = (value: string) =>
  value.split(/[\s,]+/).filter((felt) => felt !== "");

// A word as MASM's `push` takes it: `0x` and 64 hex digits.
export const isWord = (value: string) =>
  /^0x[0-9a-fA-F]{64}$/.test(value.trim());

// Why an argument can't be sent, or nothing when it can. `max` bounds a
// `Felt` that stands for a smaller integer (`ProcedureParam.max`).
export const procedureArgumentError = (
  argument: ProcedureArgument | undefined,
  max?: bigint,
) => {
  if (!argument) {
    return "Required.";
  }
  switch (argument.type) {
    case "Felt": {
      if (!isFelt(argument.value)) {
        return "Not a field element.";
      }
      return max !== undefined && BigInt(argument.value.trim()) > max
        ? `At most ${max}.`
        : undefined;
    }
    case "Word": {
      return isWord(argument.value)
        ? undefined
        : "Not a word: 0x and 64 hex digits.";
    }
    case "AccountId": {
      return argument.accountId ? undefined : "Select an account.";
    }
    case "Asset": {
      return !argument.faucetId
        ? "Select an asset."
        : /^[0-9]+$/.test(argument.amount.trim())
          ? undefined
          : "Not an amount.";
    }
    case "Felts": {
      return argument.values.every(isFelt) ? undefined : "Not a field element.";
    }
    case "Stack": {
      const felts = stackFelts(argument.value);
      return !felts.every(isFelt)
        ? "Not a field element."
        : felts.length > MAX_ARGUMENT_FELTS
          ? `At most ${MAX_ARGUMENT_FELTS} felts.`
          : undefined;
    }
  }
};

// The felts each typed argument takes on the stack.
const typedFeltCounts = { Felt: 1, Word: 4, AccountId: 2, Asset: 8 } as const;

// The felts a call passes, or nothing when a parameter's count is unknown. A
// stack's count is its argument's (`procedureArgumentError` bounds it).
export const procedureArgumentFelts = (params: ProcedureParam[]) => {
  let total = 0;
  for (const { type, feltCount, stack } of params) {
    const count = stack ? 0 : type ? typedFeltCounts[type] : feltCount;
    if (count === undefined) {
      return undefined;
    }
    total += count;
  }
  return total;
};

// Whether every parameter has a type the forms know, or a layout of felts,
// and a valid argument of that kind, and the call fits the stack.
export const procedureArgumentsReady = (
  params: ProcedureParam[],
  args: ProcedureArguments,
) => {
  const total = procedureArgumentFelts(params);
  return (
    total !== undefined &&
    total <= MAX_ARGUMENT_FELTS &&
    params.every(({ name, type, feltCount, max, stack }) => {
      const argument = args[name];
      if (stack) {
        // Nothing typed is an empty stack: a procedure that takes none.
        return (
          argument === undefined ||
          (argument.type === "Stack" &&
            procedureArgumentError(argument) === undefined)
        );
      }
      return (
        argument !== undefined &&
        (type
          ? argument.type === type
          : argument.type === "Felts" &&
            argument.values.length === feltCount) &&
        procedureArgumentError(argument, max) === undefined
      );
    })
  );
};

// What a fungible asset's id adds to its faucet's suffix: composition
// fungible, version 1 (`ASSET_METADATA_FUNGIBLE`, miden-standards 0.17.1
// `asm/standards/assets/fungible_asset.masm`). The SDK's
// `FungibleAsset.vaultKey()` gives the same. Any other value is an id the
// vault doesn't hold: a procedure reading the balance gets zero.
const FUNGIBLE_ASSET_METADATA = 0x11n;

// The inputs `formatProcedureInputs` (lib/utils/script.ts) pushes, in the
// encoding the account page's Invoke dialog uses. `accountIdParts` splits an
// account id into its two felts (`accountIdParts` in lib/web-client.ts).
export const encodeProcedureArguments = ({
  params,
  args,
  accountIdParts,
}: {
  params: ProcedureParam[];
  args: ProcedureArguments;
  accountIdParts: (accountId: string) => { prefix: bigint; suffix: bigint };
}): MidenInput[] =>
  params.map(({ name, type, feltCount, stack }) => {
    const argument = args[name];
    if (stack) {
      return {
        name,
        type: "Felts",
        value: JSON.stringify(
          argument?.type === "Stack"
            ? stackFelts(argument.value).map((value) =>
                BigInt(value).toString(),
              )
            : [],
        ),
      };
    }
    if (
      !type &&
      feltCount !== undefined &&
      argument?.type === "Felts" &&
      argument.values.length === feltCount
    ) {
      return {
        name,
        type: "Felts",
        value: JSON.stringify(
          argument.values.map((value) => BigInt(value.trim()).toString()),
        ),
      };
    }
    if (!type || !argument || argument.type !== type) {
      throw new Error(`Missing argument "${name}".`);
    }
    switch (argument.type) {
      case "AccountId": {
        const { prefix, suffix } = accountIdParts(argument.accountId);
        return {
          name,
          type,
          value: JSON.stringify({
            prefix: prefix.toString(),
            suffix: suffix.toString(),
          }),
        };
      }
      case "Asset": {
        const { prefix, suffix } = accountIdParts(argument.faucetId);
        return {
          name,
          type,
          value: JSON.stringify({
            prefix: prefix.toString(),
            suffix: (suffix + FUNGIBLE_ASSET_METADATA).toString(),
            amount: argument.amount.trim() || "0",
          }),
        };
      }
      case "Felt":
      case "Word": {
        return { name, type, value: argument.value.trim() };
      }
      default: {
        throw new Error(`Missing argument "${name}".`);
      }
    }
  });

// The pushes of a call's arguments, before its `call`: the last parameter
// first, so the first ends on top of the stack.
export const formatProcedureInputs = (inputs: MidenInput[]) =>
  inputs
    .toReversed()
    .map((arg) => {
      switch (arg.type) {
        case "Felt":
        case "Word": {
          return `push.${arg.value}`;
        }
        // The protocol's `AccountId`, `[suffix, prefix]` with the suffix on
        // top (miden-protocol 0.18's `struct { suffix: felt, prefix: felt }`).
        case "AccountId": {
          const { prefix, suffix } = JSON.parse(arg.value ?? "") as {
            prefix: string;
            suffix: string;
          };
          return `push.${prefix}.${suffix}`;
        }
        case "Asset": {
          const { prefix, suffix, amount } = JSON.parse(arg.value ?? "") as {
            prefix: string;
            suffix: string;
            amount: string;
          };
          return `push.0.0.0.${amount}\npush.${prefix}.${suffix}.0.0\n`;
        }
        // A type's felts in the order of its layout's fields, the first on
        // top: pushed last. The typed cases above follow the same rule
        // (`AccountId` is `suffix` then `prefix`; an `Asset` its id word
        // `[0, 0, suffix, prefix]` then its value word `[amount, 0, 0, 0]`).
        case "Felts": {
          const felts = JSON.parse(arg.value ?? "[]") as string[];
          return felts.length > 0 ? `push.${felts.toReversed().join(".")}` : "";
        }
        default: {
          return "";
        }
      }
    })
    .join("\n");

// A word as the SDK's `Word.toHex()` prints it: each felt as 8 little-endian
// bytes.
export const wordToHex = (felts: bigint[]) =>
  `0x${felts
    .slice(0, 4)
    .map((felt) =>
      Array.from({ length: 8 }, (_, byte) =>
        ((felt >> BigInt(8 * byte)) & 0xffn).toString(16).padStart(2, "0"),
      ).join(""),
    )
    .join("")}`;

// A procedure's result, from the top of the stack it leaves: a felt or an
// integer below one in decimal, a word in hex, anything else as its felts.
// Empty when it returns nothing.
export const decodeProcedureResult = (
  { results }: Pick<Signature, "results">,
  stack: bigint[],
) => {
  const [result] = results;
  if (!result) {
    return "";
  }
  const type = knownType(result);
  if (type === "Word") {
    return wordToHex(stack);
  }
  if (type === "Felt" || boundedFelt(result)) {
    return (stack[0] ?? 0n).toString();
  }
  // Four bytes per felt in the manifest's layout.
  const count =
    feltCount(result) ?? Math.ceil((structOf(result)?.size ?? 4) / 4);
  return `[${stack.slice(0, Math.max(1, count)).map(String).join(", ")}]`;
};

// The stack a procedure without a signature leaves, which the manifest
// doesn't describe: its felts from the top, without the zeros that pad it,
// one at least.
const untypedResult = (stack: bigint[]) => {
  const last = stack.findLastIndex((felt) => felt !== 0n);
  return `[${stack
    .slice(0, Math.max(1, last + 1))
    .map(String)
    .join(", ")}]`;
};

// A procedure's result as the forms show it: decoded by its signature, or
// the stack it leaves when it declares none.
export const procedureResult = (
  { signature, untyped }: Pick<ProcedureExport, "signature" | "untyped">,
  stack: bigint[],
) => (untyped ? untypedResult(stack) : decodeProcedureResult(signature, stack));

// An execution error as the SDK reports it, without miette's hint and its
// debug formatting: the diagnostic's message alone.
export const cleanExecutionError = (error: string) =>
  error
    .split("\n")
    .filter((line) => !line.startsWith("NOTE: If you're looking for the fancy"))
    .map((line) =>
      line.replace(/^Diagnostic \{ message: "(.*)", labels: .*$/, "$1"),
    )
    .join("\n")
    .trim();
