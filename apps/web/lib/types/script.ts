export const scriptTypes = {
  library: "Library",
  account: "Account Component",
  "note-script": "Note Script",
  "transaction-script": "Transaction Script",
  "authentication-component": "Authentication Component",
} as const;

export type ScriptType = keyof typeof scriptTypes;

export type ScriptExampleItem = {
  name: string;
  type: ScriptType;
};

export const scriptExamples = {
  "counter-account": { name: "Counter Contract", type: "account" },
  "p2id-note": { name: "P2ID Note", type: "note-script" },
  "counter-note": { name: "Counter Note", type: "note-script" },
} as const;

export type ScriptExample = keyof typeof scriptExamples;

export const scriptStatuses = {
  draft: "Draft",
  compiled: "Compiled",
  error: "Error",
} as const;

export type ScriptStatus = keyof typeof scriptStatuses;

export type MidenType = "Felt" | "Word" | "AccountId" | "FaucetId" | "Asset";

export type MidenInput = {
  name: string;
  type: MidenType;
  value: string;
};

export type Signature = {
  abi: number;
  params: MidenType[];
  results: MidenType[];
};

export type ProcedureExport = {
  path: string;
  digest: string;
  signature: Signature;
  attributes: { attrs: string[] };
  readOnly?: boolean;
};

export type Export = { Procedure: ProcedureExport };

export type Dependency = {
  id: string;
  name: string;
  type: ScriptType;
  digest: string;
};

export const baseDependency: Dependency = {
  id: "base",
  name: "base",
  type: "library",
  digest: "0xfdb2ca9bbbf77002ea29ed266fed210f7a75dca0d6939ad015f6925a027ad650",
};

export const stdDependency: Dependency = {
  id: "std",
  name: "std",
  type: "library",
  digest: "0xe5b1988c03ba3b190595c78d20f3b0fdf105048ad3edc7498cacf8676b4d9434",
};

export type PackageSource = { cargoToml: string; rust: string };

export type Script = {
  id: string;
  name: string;
  type: ScriptType;
  status: ScriptStatus;
  readOnly: boolean;
  rust: string;
  masm: string;
  error: string;
  digest: string;
  masp: string;
  exports: Export[];
  procedureExports: ProcedureExport[];
  dependencies: Dependency[];
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
  | "rust"
  | "digest"
  | "masp"
  | "exports"
  | "error"
  | "dependencies"
>;

export type CargoToml = {
  package: {
    name: string;
    version: string;
    edition: string;
    metadata: {
      miden: {
        "project-kind": ScriptType;
        dependencies: Record<string, { path: string }>;
      };
      component: {
        package: string;
        target: {
          dependencies: Record<string, { path: string }>;
        };
      };
    };
  };
};
