import type {
  packageStatusEnum,
  packagesTable,
  packageTypeEnum,
} from "@/db/schema";

export type ScriptExample =
  | "none"
  | "p2id-note"
  | "auth-no-auth"
  | "counter-account"
  | "counter-note"
  | "counter-script"
  | "count-reader";

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
  // Any name `TargetType` parses (see toPackageType), aliases included.
  lib: { kind: string; namespace: string };
  dependencies: Record<string, string | { path: string }>;
};

export type NewPackage = typeof packagesTable.$inferInsert;

export type Package = Omit<
  typeof packagesTable.$inferSelect,
  "files" | "exports" | "metadata"
> & {
  files: Record<string, string>;
  exports: Export[];
  metadata: PackageMetadata | null;
};

// An account component's storage slots, from the account component metadata
// the toolchain embeds in the package, as api-compile returns them
// (`StorageSchema` in miden-source-code-verification's `packages/utils`).
// Types are the schema's names: `word`, `felt`, or a named type.
export type StorageSlotSchema = {
  // The slot's full name, e.g. `counter_contract::counter_contract::count_map`.
  name: string;
  description?: string;
} & (
  | { type: "value"; valueType: string; defaultValue?: string }
  | { type: "map"; keyType: string; valueType: string }
);

// A field of a note's storage (its inputs), in declaration order, which is the
// order of its felts in the note's storage.
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

// What api-compile reads from a package besides its manifest. Each key is
// absent when the package has none, or when api-compile didn't report it (an
// image older than the schemas).
export type PackageMetadata = {
  storage?: { slots: StorageSlotSchema[] };
  noteStorage?: { name: string; fields: NoteStorageField[] };
};

export const defaultPackage = (): Package => ({
  id: "",
  name: "",
  type: "account-component",
  status: "compiled",
  readOnly: true,
  files: {},
  masm: "",
  commitment: "",
  masp: "",
  exports: [],
  dependencies: [],
  metadata: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

// A package's type: Miden's `TargetType` names (miden-mast-package), plus the
// playground's authentication-component.
export type PackageType = (typeof packageTypeEnum.enumValues)[number];

export type PackageStatus = (typeof packageStatusEnum.enumValues)[number];

type ProcedureSignature = { abi: number; params: string[]; results: string[] };

export type ProcedureExport = {
  path: string;
  digest: string;
  signature: ProcedureSignature | null;
  attributes: { attrs: string[] };
  // Whether the procedure is read-only, as api-compile reads it from the MAST
  // (`readOnly` next to the manifest, which doesn't record it): `null` when it
  // can't be told. Missing from packages compiled before api-compile reported
  // it: they get it on their next compile.
  readOnly?: boolean | null;
};

export const defaultProcedureExport = (): ProcedureExport => ({
  path: "",
  digest: "",
  signature: { abi: 0, params: [], results: [] },
  attributes: { attrs: [] },
});

export type Export = { Procedure: ProcedureExport };

export type PackageDependency = {
  name: string;
  kind: string;
  version: string;
  digest: string;
};

export type Dependency = {
  id: string;
  name: string;
  type: PackageType;
  commitment: string;
};

// The body of `POST /scripts/import`: a project's sources, by package dir.
export type PackageSource = { midenProjectToml: string; rust: string };

// The files of a package the web app shows (and edits: `src/lib.rs` only),
// without the `<name>/` prefix they're stored under.
export const scriptFilePaths = [
  "src/lib.rs",
  "Cargo.toml",
  "miden-project.toml",
] as const;

export type ScriptFilePath = (typeof scriptFilePaths)[number];

export type ScriptFiles = Partial<Record<ScriptFilePath, string>>;

export type CompiledPackage = Pick<
  Package,
  | "id"
  | "name"
  | "type"
  | "status"
  | "masm"
  | "commitment"
  | "masp"
  | "exports"
  | "metadata"
> & {
  // rustc's rendered output: the failed build's in `error`, a successful one's
  // (warnings) in `warnings`. Neither is stored.
  error: string;
  warnings: string;
  dependencies: Dependency[];
  files: ScriptFiles;
};

export type Manifest = { exports: Export[]; dependencies: PackageDependency[] };
