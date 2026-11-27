export const scriptTypes = {
  kernel: "Kernel",
  library: "Library",
  "account-component": "Account Component",
  note: "Note Script",
  // Miden's canonical name (`TargetType` in miden-mast-package), not the
  // "tx-script" alias, which states persisted before the rename still hold
  // (migrateScript).
  "transaction-script": "Transaction Script",
  "authentication-component": "Authentication Component",
} as const;

export type ScriptType = keyof typeof scriptTypes;

// Unused at the moment.
// export type ScriptExampleItem = {
//   name: string;
//   type: ScriptType;
// };

export const scriptExamples = {
  "p2id-note": { name: "P2ID Note", type: "note" },
  "auth-no-auth": { name: "Auth No Auth", type: "account-component" },
  "counter-account": { name: "Counter Contract", type: "account-component" },
  "counter-note": { name: "Counter Note", type: "note" },
  "counter-script": { name: "Counter Script", type: "transaction-script" },
  "count-reader": { name: "Count Reader", type: "account-component" },
} as const;

export type ScriptExample = keyof typeof scriptExamples;

export const scriptStatuses = {
  draft: "Draft",
  compiled: "Compiled",
  error: "Error",
} as const;

export type ScriptStatus = keyof typeof scriptStatuses;

// The four types the forms have an input for: a felt, a word, the account
// picker and the asset input. `knownType` (lib/utils/procedure-inputs.ts)
// reads them from a manifest's layout.
export const midenTypes = ["Felt", "Word", "AccountId", "Asset"] as const;

export type MidenType = (typeof midenTypes)[number];

// A struct's layout in a MASM package's manifest: its bare name (`AccountId`
// and `Asset` for the two the forms know, or a struct the source defines),
// its size in bytes (four per felt) and its fields in declaration order. The
// built-ins' hand-written signatures copy the manifest's.
export type MidenTypeStruct = {
  Struct: {
    name: string;
    repr?: unknown;
    size?: number;
    fields?: MidenTypeField[];
  };
};

export type MidenTypeField = { name?: string; ty: MidenTypeLayout };

// A type as the manifest lays it out (miden-assembly's `Type`): a primitive
// by name (`"Felt"`, and `"U64"`, `"U32"`, `"U16"`, `"U8"`, `"I1"`), a
// struct, an array (`{ Array: { ty: "Felt", len: 4 } }` is a word), or an
// enum (`{ Enum: { name, discriminant, variants } }`, `NoteType`).
export type MidenTypeLayout =
  | string
  | MidenTypeStruct
  | (Record<string, unknown> & { Struct?: undefined });

// `Felts`: a type the forms don't know, entered as its felts, in the order
// of its layout's fields. Its `value` is the JSON array of the felts as
// decimal strings.
export type MidenInput = {
  name: string;
  type: MidenType | "Felts";
  value: string;
};

export type Signature = {
  abi: number;
  params: MidenTypeLayout[];
  results: MidenTypeLayout[];
};

// A procedure's attributes, as the package manifest serializes its externally
// tagged `Attribute` enum: a marker for `@note_script`,
// `@transaction_script` or `@account_procedure`. The built-in scripts have
// none.
export type ProcedureAttribute = { Marker: string } | Record<string, unknown>;

export type ProcedureExport = {
  path: string;
  digest: string;
  signature: Signature;
  // Set when the source declares no signature (`pub proc add`, its stack
  // effect in a comment): the manifest's is null, and `signature` is then
  // empty. The forms take the stack as raw felts (`procedureParams`) and show
  // the stack it leaves (`procedureResult`).
  untyped?: boolean;
  attributes: { attrs: ProcedureAttribute[] };
  // Whether it only reads state, so its Invoke button runs it locally
  // (`canInvokeProcedure`). api-compile reads it from the MAST and the API
  // stores it with each export: `null` when it can't be told, missing from
  // packages compiled before api-compile reported it. A script's
  // `procedureExports` always hold a boolean (`isReadOnlyProcedure`).
  readOnly?: boolean | null;
  // Whether it calls another account's procedure (FPI), from api-compile's
  // MAST walk, stored with each export like `readOnly`: `true` when it does,
  // `false` when it doesn't, `null` when it can't be told. Missing from
  // built-ins, registry packages and packages compiled before api-compile
  // reported it. Only `true` acts: the Simulate tab refuses the procedure
  // (`simulationBlockedReason`), whose foreign account the mock client can't
  // serve.
  callsForeign?: boolean | null;
  // The parameters' names and types as the MASM source spells them
  // (`counter_account_id: AccountId`), in the signature's order: api-compile
  // reads them from the source (`parameters`), and the API stores them with
  // each export like `readOnly`. Missing when api-compile found none (a
  // procedure without parameters), and from packages compiled before it
  // reported them: the forms then name them `param_N` (`procedureParams`).
  // The names are used, and the type to label a parameter.
  parameters?: { name: string; type: string }[];
};

export type Export = { Procedure: ProcedureExport };

export type Dependency = {
  id: string;
  name: string;
  // kind: "library" | "kernel" | "account-component";
  // version: string;
  type: ScriptType;
  commitment: string;
};

// The dependency fields of a script (or any wider object).
export const toDependency = ({
  id,
  name,
  type,
  commitment,
}: Dependency): Dependency => ({ id, name, type, commitment });

// The body of the API's `POST /scripts/import`: a project's sources, its
// manifest and its one MASM module.
export type PackageSource = { midenProjectToml: string; masm: string };

// The files of a script the editor shows, by path in its project: its MASM
// source (`scriptSourcePath` in lib/utils/script-files.ts), the only one
// edited, and the miden-project.toml the API generates. The built-in scripts
// have no manifest, the built-in libraries no file at all.
export type ScriptFiles = Record<string, string>;

// An account component's storage slot, as the package's storage schema
// describes it. A MASM package has none: the schemas are hand-written, for
// the built-ins and the API's templates. Types are the schema's names: `word`, `felt`, or a named
// type such as `miden::standards::auth::pub_key`.
export type StorageSlotSchema = {
  // The slot's full name, e.g. `counter_contract::counter_contract::count_map`.
  name: string;
  description?: string;
} & (
  | {
      type: "value";
      valueType: string;
      // A word in hex (`Word.toHex()`), when the schema gives a default.
      defaultValue?: string;
    }
  | { type: "map"; keyType: string; valueType: string }
);

export type StorageSchema = { slots: StorageSlotSchema[] };

// A field of a note's storage. The fields' felts follow each
// other in the note's storage, in declaration order.
export type NoteStorageField = {
  // The field's name, in kebab case, e.g. `target-account-id`.
  name: string;
  // Its type name: `felt`, `word`, `account-id`, `u64`... or a record the
  // note defines.
  type: string;
  // The felts it takes. Absent when that varies (an `option` or a `variant`).
  width?: number;
  description?: string;
};

export type NoteStorageSchema = { name: string; fields: NoteStorageField[] };

// What the API returns of a package besides its manifest. A key is absent when
// the package has none, or when it was compiled before api-compile reported
// it.
export type PackageMetadata = {
  storage?: StorageSchema;
  // The storage slot names an account component's source declares (its
  // `word("…")` constants), when it has no `storage` schema: the slots the
  // forms start from, each one's type and value left to the user
  // (`declaredStorageSlots`). Absent when the source declares none, and from
  // packages compiled before the API read them.
  slotNames?: string[];
  noteStorage?: NoteStorageSchema;
  // The account procedures a note or transaction script `call`s, by MAST root
  // (`0x…` hex, sorted): the Simulate tab's target dropdown lists only the
  // accounts whose code has all of them (`useScriptTargetAccounts`). `[]`
  // when it calls none: every account can run it. `null` when api-compile
  // couldn't tell (a dynamic call is reachable), and absent for other
  // packages and packages compiled before api-compile reported it: both mean
  // no filter.
  accountProcedures?: string[] | null;
};

// A diagnostic of api-compile's MASM build (the MASM wire format, in the
// verifier repo's spec/remove-rust/README.md). `file` is relative to the
// build's root, so it starts with the package's directory
// (`counter-account/counter_account.masm`). `line` and `column` start at 1,
// like Monaco's, and `length` counts characters. A diagnostic without a
// position is shown in the console only.
export type Diagnostic = {
  severity: "error" | "warning";
  message: string;
  file?: string;
  line?: number;
  column?: number;
  length?: number;
  // What the span is marked with, when it says more than `message`.
  label?: string;
  help?: string;
};

export type Script = {
  id: string;
  name: string;
  type: ScriptType;
  status: ScriptStatus;
  readOnly: boolean;
  files: ScriptFiles;
  // The MASM a built-in script is assembled from in the browser
  // (`assembledFromMasm`), also its source in `files`. Empty for the API's
  // scripts, whose source is the MASM.
  masm: string;
  // The last compile's output: the assembler's rendered errors when it
  // failed, its warnings when it succeeded. The API stores neither: a script fetched from
  // it (or saved before `warnings` existed) may lack them.
  error: string;
  warnings: string;
  // The same diagnostics as a list, for the editor's markers and the
  // console's counts. Missing where `error` and `warnings` are, and on a
  // script compiled before api-compile assembled MASM.
  diagnostics?: Diagnostic[];
  commitment: string;
  masp: string;
  exports: Export[];
  procedureExports: ProcedureExport[];
  dependencies: Dependency[];
  // The package's schemas. Null or missing for a draft, a failed build, a
  // built-in script, and a script compiled, persisted or saved before the API
  // returned them: the Simulate tab then works without.
  metadata?: PackageMetadata | null;
  createdAt: number;
  updatedAt: number;
};

export type CompiledPackage = Pick<
  Script,
  | "id"
  | "name"
  | "type"
  | "status"
  | "files"
  | "commitment"
  | "masp"
  | "exports"
  | "error"
  | "warnings"
  | "diagnostics"
  | "dependencies"
  | "metadata"
>;

export type MidenProjectToml = {
  package: {
    name: string;
    version: string;
    metadata: {
      miden: {
        "supported-types": string[];
        dependencies: Record<string, { path: string }>;
      };
    };
  };
  lib: { kind: ScriptType; namespace: string; path?: string };
  dependencies: Record<string, string | { path: string }>;
};

export type Package = {
  id: string;
  name: string;
  type: ScriptType;
  files: Record<string, string>;
  commitment: string;
  masp: string;
  manifest: {
    exports: Export[];
    dependencies: {
      kind: ScriptType;
      name: string;
      digest: string;
      version: string;
    }[];
  };
  // The registry's parameter names by export path (`ProcedureExport`'s
  // `parameters`): null or missing for a package stored before it reported
  // them.
  parameters?: Record<string, { name: string; type: string }[]> | null;
  createdAt: string;
  updatedAt: string;
};
