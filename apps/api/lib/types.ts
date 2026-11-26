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
  // `path` is the root module, relative to the manifest.
  lib: { kind: string; namespace: string; path?: string };
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

// An account component's storage slots. A MASM package has no storage
// schema: the API writes this one by hand for its own templates (plan 02 of
// spec/remove-rust). Types are the schema's names: `word`, `felt`, or a named
// type.
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
  // The field's name, in kebab case, e.g. `target-account-id`.
  name: string;
  // Its type name: `felt`, `word`, `account-id`, `u64`... or a record the
  // note defines.
  type: string;
  // The felts it takes. Absent when that varies (an `option` or a `variant`).
  width?: number;
  description?: string;
};

// What the API knows of a package besides its manifest: the hand-written
// schemas of a template (`storage`, `noteStorage`) and what api-compile reads
// from the MAST (`accountProcedures`). Each key is absent when the package
// has none.
export type PackageMetadata = {
  storage?: { slots: StorageSlotSchema[] };
  noteStorage?: { name: string; fields: NoteStorageField[] };
  // The template a note was created from, while it keeps its `noteStorage`:
  // a note's schema holds only while its source is that template's as
  // shipped (lib/package-metadata.ts).
  template?: ScriptExample;
  // A note or transaction script's account procedures: the MAST roots
  // (`0x…` hex, sorted) it `call`s, `[]` when it calls none. api-compile
  // sends `null` when it can't tell (a dynamic call is reachable); the API
  // stores no key then.
  accountProcedures?: string[] | null;
};

// A template's hand-written schemas (templates/*.schema.ts), which the API
// sets as a package's `metadata` when it creates one from the template.
export type TemplateSchema = Pick<PackageMetadata, "storage" | "noteStorage">;

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
  ownerKeyHash: null,
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
  // Whether the procedure calls another account's procedure (FPI), as
  // api-compile reads it from the MAST (`callsForeign` next to `readOnly`):
  // `null` when it can't be told. Missing from packages compiled before
  // api-compile reported it, like `readOnly`.
  callsForeign?: boolean | null;
  // The parameters' names and types, in the signature's order (`parameters`
  // next to `readOnly`, read from the MASM source). Missing when api-compile
  // found no names or not as many as the signature has parameters, and from
  // packages compiled before api-compile reported them.
  parameters?: ProcedureParameter[];
};

export type ProcedureParameter = { name: string; type: string };

export const defaultProcedureExport = (): ProcedureExport => ({
  path: "",
  digest: "",
  signature: { abi: 0, params: [], results: [] },
  attributes: { attrs: [] },
});

export type Export = { Procedure: ProcedureExport };

// An export of a manifest as api-compile answers it: a procedure, or a type
// the source declares `pub` (`{ Type: { path, ty } }`), which carries no
// signature.
export type ManifestExport = Export | { Type: unknown; Procedure?: undefined };

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
// One MASM module per package.
export type PackageSource = { midenProjectToml: string; masm: string };

// The files of a package the web app shows (`scriptFilePaths` in
// lib/source-file.ts): its MASM source and its miden-project.toml, without
// the `<name>/` prefix they're stored under.
export type ScriptFiles = Record<string, string>;

// A diagnostic of api-compile's assembler (the verifier's MASM wire format):
// `file` is relative to the build's root (`<name>/<name>.masm`), `line` and
// `column` start at 1, `length` is in characters.
export type Diagnostic = {
  severity: "error" | "warning";
  message: string;
  file?: string;
  line?: number;
  column?: number;
  length?: number;
  label?: string;
  help?: string;
};

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
  // api-compile's output, passed through as it answered: its diagnostics,
  // and the assembler's rendering of them in `stderr`. None of it is stored.
  diagnostics: Diagnostic[];
  stdout: string;
  stderr: string;
  // `stderr` again, under the names the web app reads: the failed build's in
  // `error`, a successful one's (warnings) in `warnings`.
  error: string;
  warnings: string;
  dependencies: Dependency[];
  files: ScriptFiles;
};

export type Manifest = {
  exports: ManifestExport[];
  dependencies: PackageDependency[];
};
