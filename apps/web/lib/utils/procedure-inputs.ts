// A procedure's arguments, from a form to the `MidenInput`s a call script
// pushes, and its result, from the stack to text. No SDK import: the unit
// tests run on plain node.
import {
  type MidenInput,
  type MidenType,
  type MidenTypeLayout,
  type MidenTypeStruct,
  midenTypes,
  type ProcedureExport,
  type Signature,
} from "../types/script.ts";

// The Miden field's modulus: 2^64 - 2^32 + 1.
const FELT_MODULUS = 2n ** 64n - 2n ** 32n + 1n;

// The felts a call can pass on the stack. midenc refuses to compile an export
// whose flattened parameters take more ("only up to 16 felt flattened params
// supported", frontend/wasm/src/component/lift_exports.rs, sdk 0.15), so no
// package has one: the check in `procedureArgumentsReady` is a guard.
export const MAX_ARGUMENT_FELTS = 16;

export type ProcedureParam = {
  name: string;
  // Undefined for a type the forms don't know (`note-idx`, `asset-id`, a
  // record the package defines…): entered as raw felts when `feltCount` is
  // set, and otherwise the procedure can't be invoked from them.
  type?: MidenType;
  // Without a `type`: how many felts the type's layout flattens to, and each
  // one's field path in it (`feltNames`), in field order. Unset when the
  // manifest has no layout for it or the layout has a leaf that isn't a felt
  // (`feltLeaves`).
  feltCount?: number;
  feltNames?: string[];
  // The type's name in the manifest, without its package: `felt`, `note-idx`.
  rawType: string;
  // What the form shows next to the name, `type` when unset: a note's `u32`
  // field is entered as a felt.
  label?: string;
};

// What a form holds for one parameter.
export type ProcedureArgument =
  | { type: "Felt" | "Word"; value: string }
  | { type: "AccountId"; accountId: string }
  | { type: "Asset"; faucetId: string; amount: string }
  // A type the forms don't know, as its felts in field order.
  | { type: "Felts"; values: string[] };

export type ProcedureArguments = Record<string, ProcedureArgument>;

const structOf = (type: MidenTypeLayout) =>
  typeof type === "object" && type !== null && type.Struct
    ? (type as MidenTypeStruct).Struct
    : undefined;

// One of the four types the forms know, or nothing.
const knownType = (type: MidenTypeLayout): MidenType | undefined => {
  const name = structOf(type)?.name;
  return name === undefined
    ? undefined
    : (midenTypes as Record<string, MidenType>)[name];
};

// A type's name without its package: `note-idx`. A primitive's in lower case
// (`u64`), and another kind's own name, or its kind (`option0`, `enum`).
const rawProcedureTypeName = (type: MidenTypeLayout) => {
  if (typeof type === "string") {
    return type.toLowerCase();
  }
  const struct = structOf(type);
  if (struct) {
    return struct.name.split("/").at(-1) ?? struct.name;
  }
  const [kind, layout] = Object.entries(type)[0] ?? ["unknown"];
  const name = (layout as { name?: unknown } | undefined)?.name;
  return typeof name === "string" ? name : kind.toLowerCase();
};

// The felts a type's layout flattens to, each as its path of field names, in
// field order: `note-idx` is `["inner.inner"]`, `asset-id`
// `["inner.a.inner", …, "inner.d.inner"]`. Undefined when the layout is
// missing (a built-in's hand-written signature) or has a leaf that isn't a
// felt (a `u64`, a `bool`, an option): how those reach the stack isn't
// established.
export const feltLeaves = (
  type: MidenTypeLayout,
  path: string[] = [],
): string[] | undefined => {
  if (type === "Felt") {
    return [path.join(".")];
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

// What the form calls each felt of a raw argument: its field path without
// the `inner` wrappers (`a`…`d` for an `asset-id`, `first` and `second` for
// a record of two felts), or its position when that names nothing or isn't
// unique.
const feltNames = (leaves: string[]) => {
  const names = leaves.map((leaf) =>
    leaf
      .split(".")
      .filter((segment) => segment !== "inner")
      .join("."),
  );
  return names.every((name) => name !== "") &&
    new Set(names).size === names.length
    ? names
    : leaves.map((_, index) => `felt ${index + 1}`);
};

// The parameters' names in snake case, as the Rust source spells them, from
// the WIT names api-compile reports with the export: `deposit-asset` is
// `deposit_asset`. Undefined when the list is missing (a package compiled
// before api-compile reported them, a built-in, a transaction script), has
// another length than the signature's, or holds an empty or repeated name:
// the arguments are keyed by name, so names must be unique.
export const procedureParameterNames = ({
  signature,
  parameters,
}: Pick<ProcedureExport, "signature" | "parameters">): string[] | undefined => {
  if (!parameters || parameters.length !== signature.params.length) {
    return undefined;
  }
  const names = parameters.map(({ name }) => name.replaceAll("-", "_"));
  return names.every((name) => name !== "") &&
    new Set(names).size === names.length
    ? names
    : undefined;
};

// The WIT's name for the type of a parameter the forms don't know, when the
// export has names (`procedureParameterNames`), else the manifest's. The
// manifest names a layout once: the basic wallet's `tag` and `note-type` are
// both `note-idx` there, its `recipient` an `asset-id`.
const unknownTypeName = (
  { parameters }: Pick<ProcedureExport, "parameters">,
  named: boolean,
  param: MidenTypeLayout,
  index: number,
) => (named && parameters?.[index]?.type) || rawProcedureTypeName(param);

// The manifest's signature has the parameters' types, the WIT their names.
// Without names, every parameter is named by its position: never a mix.
export const procedureParams = (
  procedureExport: Pick<ProcedureExport, "signature" | "parameters">,
): ProcedureParam[] => {
  const names = procedureParameterNames(procedureExport);
  return procedureExport.signature.params.map((param, index) => {
    const type = knownType(param);
    const leaves = type ? undefined : feltLeaves(param);
    return {
      name: names?.[index] ?? `param_${index}`,
      type,
      rawType: type
        ? rawProcedureTypeName(param)
        : unknownTypeName(procedureExport, names !== undefined, param, index),
      ...(leaves && {
        feltCount: leaves.length,
        feltNames: feltNames(leaves),
      }),
    };
  });
};

// Rust packages export kebab-case names, displayed as their snake_case source
// names.
export const formatProcedureExportPath = (path: string) =>
  path.split("::").at(-1)?.replaceAll('"', "").replaceAll("-", "_") ?? "";

export const formatProcedureExportResultType = (type: MidenTypeLayout) => {
  switch (structOf(type)?.name) {
    case "miden:base/core-types@1.0.0/felt": {
      return "Felt";
    }
    case "miden:base/core-types@1.0.0/word": {
      return "Word";
    }
    case "miden:base/core-types@1.0.0/account-id": {
      return "AccountId";
    }
    case "miden:base/core-types@1.0.0/asset": {
      return "Asset";
    }
  }
};

// A procedure as its Rust signature: `fn deposit(depositor: AccountId,
// deposit_asset: Asset)`, or its parameters' types alone when it has no
// names (`procedureParameterNames`): `fn deposit(AccountId, Asset)`.
export const procedureSignature = (procedureExport: ProcedureExport) => {
  const {
    path,
    signature: { params, results },
  } = procedureExport;
  const names = procedureParameterNames(procedureExport);
  let result = `fn ${formatProcedureExportPath(path)}(`;
  result += params
    .map((param, index) => {
      const type =
        formatProcedureExportResultType(param) ??
        unknownTypeName(procedureExport, names !== undefined, param, index);
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

// A word as MASM's `push` takes it: `0x` and 64 hex digits.
export const isWord = (value: string) =>
  /^0x[0-9a-fA-F]{64}$/.test(value.trim());

// Why an argument can't be sent, or nothing when it can.
export const procedureArgumentError = (
  argument: ProcedureArgument | undefined,
) => {
  if (!argument) {
    return "Required.";
  }
  switch (argument.type) {
    case "Felt": {
      return isFelt(argument.value) ? undefined : "Not a field element.";
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
  }
};

// The felts each typed argument takes on the stack.
const typedFeltCounts = { Felt: 1, Word: 4, AccountId: 2, Asset: 8 } as const;

// The felts a call passes, or nothing when a parameter's count is unknown.
export const procedureArgumentFelts = (params: ProcedureParam[]) => {
  let total = 0;
  for (const { type, feltCount } of params) {
    const count = type ? typedFeltCounts[type] : feltCount;
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
    params.every(({ name, type, feltCount }) => {
      const argument = args[name];
      return (
        argument !== undefined &&
        (type
          ? argument.type === type
          : argument.type === "Felts" &&
            argument.values.length === feltCount) &&
        procedureArgumentError(argument) === undefined
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
  params.map(({ name, type, feltCount }) => {
    const argument = args[name];
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
        // case "FaucetId":
        case "AccountId": {
          const { prefix, suffix } = JSON.parse(arg.value ?? "") as {
            prefix: string;
            suffix: string;
          };
          // TODO calling convention differs between MASM and Rust
          return `push.${suffix}.${prefix}`;
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
        // (`account-id` is `prefix` then `suffix`; an `asset` its id word
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

// A procedure's result, from the top of the stack it leaves: a felt in
// decimal, a word in hex, anything else as its felts. Empty when it returns
// nothing.
export const decodeProcedureResult = (
  { results }: Pick<Signature, "results">,
  stack: bigint[],
) => {
  const [result] = results;
  if (!result) {
    return "";
  }
  const type = knownType(result);
  // Older manifests list a word's four felts as four results.
  if (type === "Word" || results.length === 4) {
    return wordToHex(stack);
  }
  if (type === "Felt") {
    return (stack[0] ?? 0n).toString();
  }
  // Four bytes per felt in the manifest's layout.
  const size = structOf(result)?.size ?? 4;
  return `[${stack
    .slice(0, Math.max(1, Math.ceil(size / 4)))
    .map(String)
    .join(", ")}]`;
};

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
