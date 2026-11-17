// A procedure's arguments, from a form to the `MidenInput`s a call script
// pushes, and its result, from the stack to text. No SDK import: the unit
// tests run on plain node.
import {
  type MidenInput,
  type MidenType,
  type MidenTypeStruct,
  midenTypes,
  type ProcedureExport,
  type Signature,
} from "../types/script.ts";

// The Miden field's modulus: 2^64 - 2^32 + 1.
const FELT_MODULUS = 2n ** 64n - 2n ** 32n + 1n;

export type ProcedureParam = {
  name: string;
  // Undefined for a type the forms don't know (`note-idx`, `asset-id`, …):
  // the procedure can't be invoked from them.
  type?: MidenType;
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
  | { type: "Asset"; faucetId: string; amount: string };

export type ProcedureArguments = Record<string, ProcedureArgument>;

// A type's name without its package: `note-idx`.
const rawProcedureTypeName = ({ Struct }: MidenTypeStruct) =>
  Struct.name.split("/").at(-1) ?? Struct.name;

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

// The manifest's signature has the parameters' types, the WIT their names.
// Without names, every parameter is named by its position: never a mix.
export const procedureParams = (
  procedureExport: Pick<ProcedureExport, "signature" | "parameters">,
): ProcedureParam[] => {
  const names = procedureParameterNames(procedureExport);
  return procedureExport.signature.params.map((param, index) => ({
    name: names?.[index] ?? `param_${index}`,
    type: midenTypes[param.Struct.name] as MidenType | undefined,
    rawType: rawProcedureTypeName(param),
  }));
};

// Rust packages export kebab-case names, displayed as their snake_case source
// names.
export const formatProcedureExportPath = (path: string) =>
  path.split("::").at(-1)?.replaceAll('"', "").replaceAll("-", "_") ?? "";

export const formatProcedureExportResultType = (type: MidenTypeStruct) => {
  switch (type.Struct.name) {
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
        formatProcedureExportResultType(param) ?? rawProcedureTypeName(param);
      return names ? `${names[index]}: ${type}` : type;
    })
    .join(", ");
  result += ")";
  if (results.length > 0) {
    result += ` -> `;
    const resultTypes = results
      .map((result) => formatProcedureExportResultType(result))
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
  }
};

// Whether every parameter has a type the forms know and a valid argument.
export const procedureArgumentsReady = (
  params: ProcedureParam[],
  args: ProcedureArguments,
) =>
  params.every(
    ({ name, type }) =>
      type !== undefined && procedureArgumentError(args[name]) === undefined,
  );

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
  params.map(({ name, type }) => {
    const argument = args[name];
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
      default: {
        return { name, type, value: argument.value.trim() };
      }
    }
  });

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
  const type = midenTypes[result.Struct.name] as MidenType | undefined;
  // Older manifests list a word's four felts as four results.
  if (type === "Word" || results.length === 4) {
    return wordToHex(stack);
  }
  if (type === "Felt") {
    return (stack[0] ?? 0n).toString();
  }
  // Four bytes per felt in the manifest's layout.
  const size = (result.Struct as { size?: number }).size ?? 4;
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
