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

export const midenTypes = {
  "miden:base/core-types@1.0.0/felt": "Felt",
  "miden:base/core-types@1.0.0/word": "Word",
  "miden:base/core-types@1.0.0/account-id": "AccountId",
  "miden:base/core-types@1.0.0/asset": "Asset",
} as const;

export type MidenRawType = keyof typeof midenTypes;

export type MidenType = (typeof midenTypes)[keyof typeof midenTypes];

export type MidenTypeStruct = {
  Struct: { name: MidenRawType /*repr: "Default"; size: number*/ };
};

export type MidenInput = {
  name: string;
  type: MidenType;
  value: string;
};

export type Signature = {
  abi: number;
  params: MidenTypeStruct[];
  results: MidenTypeStruct[];
};

// A procedure's attributes, as midenc's manifest serializes its externally
// tagged `Attribute` enum: a marker for `#[note_script]`,
// `#[transaction_script]` or `#[account_procedure]`. The built-in scripts have
// none.
export type ProcedureAttribute = { Marker: string } | Record<string, unknown>;

export type ProcedureExport = {
  path: string;
  digest: string;
  signature: Signature;
  attributes: { attrs: ProcedureAttribute[] };
  // Whether it only reads state, so its Invoke button runs it locally
  // (`canInvokeProcedure`). api-compile reads it from the MAST and the API
  // stores it with each export: `null` when it can't be told, missing from
  // packages compiled before api-compile reported it. A script's
  // `procedureExports` always hold a boolean (`isReadOnlyProcedure`).
  readOnly?: boolean | null;
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

// The body of the API's `POST /scripts/import`: a project's sources.
export type PackageSource = { midenProjectToml: string; rust: string };

// The files of a script the editor shows, by path in its project. Only
// `src/lib.rs` is edited: the API generates the manifests. The built-in
// scripts and the packages embedded for the tutorials have no manifests, the
// MASM-only built-ins no file at all.
export const scriptFilePaths = [
  "src/lib.rs",
  "Cargo.toml",
  "miden-project.toml",
] as const;

export type ScriptFilePath = (typeof scriptFilePaths)[number];

export type ScriptFiles = Partial<Record<ScriptFilePath, string>>;

// An account component's storage slot, as the package's storage schema
// describes it (api-compile reads it from the account component metadata the
// toolchain embeds). Types are the schema's names: `word`, `felt`, or a named
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
  // The field's WIT name, in kebab case, e.g. `target-account-id`.
  name: string;
  // Its WIT type name: `felt`, `word`, `account-id`, `u64`... or a record the
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
  noteStorage?: NoteStorageSchema;
};

export type Script = {
  id: string;
  name: string;
  type: ScriptType;
  status: ScriptStatus;
  readOnly: boolean;
  files: ScriptFiles;
  masm: string;
  // The last compile's output: rustc's rendered errors when it failed, its
  // warnings when it succeeded. The API stores neither: a script fetched from
  // it (or saved before `warnings` existed) may lack them.
  error: string;
  warnings: string;
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
  | "masm"
  | "files"
  | "commitment"
  | "masp"
  | "exports"
  | "error"
  | "warnings"
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
  lib: { kind: ScriptType; namespace: string };
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
  createdAt: string;
  updatedAt: string;
};
